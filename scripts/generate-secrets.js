#!/usr/bin/env node

/**
 * Generate secure secrets for JWT and Session
 * Usage: node scripts/generate-secrets.js
 */

import crypto from 'crypto';

// Generate a secure random string
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64url');
}

// Generate secrets
const jwtSecret = generateSecret(64);
const sessionSecret = generateSecret(64);

console.log('🔐 Generated Secure Secrets:\n');
console.log('JWT_SECRET=' + jwtSecret);
console.log('SESSION_SECRET=' + sessionSecret);
console.log('\n📋 Instructions:');
console.log('1. Copy these values to your .env file');
console.log('2. Add them to GitHub Secrets for CI/CD');
console.log('3. Add them to AWS Secrets Manager for production');
console.log('\n⚠️  IMPORTANT: Never commit these values to git!');
console.log('\n🔒 Security Notes:');
console.log('- These are cryptographically secure random values');
console.log('- JWT_SECRET is used for signing authentication tokens');
console.log('- SESSION_SECRET is used for session management');
console.log('- Rotate these secrets periodically in production');
