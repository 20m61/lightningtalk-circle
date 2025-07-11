/**
 * AWS Cognito authentication middleware
 * Validates Cognito ID tokens and syncs users with local database
 */

import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { hashPassword } from './auth.js';

// Cache for Cognito JWKS
let cachedJWKS = null;
let jwksLastFetched = 0;
const JWKS_CACHE_DURATION = 3600000; // 1 hour

/**
 * Fetch JWKS from Cognito
 */
async function getJWKS() {
  const now = Date.now();

  // Return cached JWKS if still valid
  if (cachedJWKS && now - jwksLastFetched < JWKS_CACHE_DURATION) {
    return cachedJWKS;
  }

  const region = process.env.AWS_REGION || 'ap-northeast-1';
  const userPoolId = process.env.VITE_USER_POOL_ID || process.env.USER_POOL_ID;

  if (!userPoolId) {
    throw new Error('User Pool ID not configured');
  }

  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

  try {
    const response = await axios.get(jwksUrl);
    cachedJWKS = response.data;
    jwksLastFetched = now;
    return cachedJWKS;
  } catch (error) {
    logger.error('Failed to fetch JWKS:', error);
    throw new Error('Failed to fetch JWKS');
  }
}

/**
 * Verify Cognito ID token
 */
export async function verifyCognitoToken(idToken) {
  try {
    // Decode token header to get key ID
    const decodedHeader = jwt.decode(idToken, { complete: true });
    if (!decodedHeader) {
      throw new Error('Invalid token format');
    }

    const kid = decodedHeader.header.kid;
    const jwks = await getJWKS();

    // Find the signing key
    const signingKey = jwks.keys.find(key => key.kid === kid);
    if (!signingKey) {
      throw new Error('Signing key not found');
    }

    // Convert JWK to PEM
    const pem = jwkToPem(signingKey);

    // Verify token
    const decoded = jwt.verify(idToken, pem, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${process.env.VITE_USER_POOL_ID || process.env.USER_POOL_ID}`,
      audience: process.env.VITE_USER_POOL_CLIENT_ID || process.env.USER_POOL_CLIENT_ID
    });

    return decoded;
  } catch (error) {
    logger.error('Token verification failed:', error);
    throw error;
  }
}

/**
 * Sync Cognito user with local database
 */
export async function syncCognitoUser(cognitoUser, database) {
  const { sub: cognitoId, email, name, picture } = cognitoUser;

  try {
    // Check if user already exists
    let user = await database.findOne('users', { cognitoId });

    if (!user) {
      // Check by email
      user = await database.findOne('users', { email });

      if (user) {
        // Update existing user with Cognito ID
        await database.update('users', user.id, {
          cognitoId,
          profileImage: picture || user.profileImage,
          lastLogin: new Date().toISOString()
        });
      } else {
        // Create new user
        const userData = {
          cognitoId,
          email,
          name: name || email.split('@')[0],
          role: 'user',
          profileImage: picture,
          provider: 'google',
          // Generate a random password for OAuth users
          password: await hashPassword(Math.random().toString(36).slice(-12)),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        user = await database.create('users', userData);
      }
    } else {
      // Update last login
      await database.update('users', user.id, {
        lastLogin: new Date().toISOString(),
        profileImage: picture || user.profileImage
      });
    }

    // Remove sensitive data before returning
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    logger.error('Failed to sync Cognito user:', error);
    throw error;
  }
}

/**
 * Middleware to authenticate Cognito tokens
 */
export function authenticateCognitoToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: '認証トークンが必要です'
    });
  }

  verifyCognitoToken(token)
    .then(async decoded => {
      // Sync user with database
      const user = await syncCognitoUser(decoded, req.app.locals.database);
      req.user = user;
      req.cognitoUser = decoded;
      next();
    })
    .catch(error => {
      logger.error('Cognito authentication failed:', error);
      res.status(403).json({
        error: 'Invalid token',
        message: '無効な認証トークンです'
      });
    });
}
