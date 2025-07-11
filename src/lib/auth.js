import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';

const REGION = 'ap-northeast-1';
const USER_POOL_ID = process.env.VITE_USER_POOL_ID;
const CLIENT_ID = process.env.VITE_USER_POOL_CLIENT_ID;
const IDENTITY_POOL_ID = process.env.VITE_IDENTITY_POOL_ID;

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

export const authService = {
  // Sign up new user
  async signUp(email, password, fullName) {
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: fullName }
      ]
    });

    try {
      const response = await cognitoClient.send(command);
      return { success: true, userSub: response.UserSub };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  // Confirm sign up with verification code
  async confirmSignUp(email, code) {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code
    });

    try {
      await cognitoClient.send(command);
      return { success: true };
    } catch (error) {
      console.error('Confirm sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in user
  async signIn(email, password) {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    try {
      const response = await cognitoClient.send(command);
      const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult;

      // Store tokens
      localStorage.setItem('idToken', IdToken);
      localStorage.setItem('accessToken', AccessToken);
      localStorage.setItem('refreshToken', RefreshToken);

      // Decode ID token to get user info
      const payload = JSON.parse(atob(IdToken.split('.')[1]));

      return {
        success: true,
        user: {
          email: payload.email,
          name: payload.name,
          sub: payload.sub
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  signOut() {
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  },

  // Get current user
  getCurrentUser() {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) return null;

    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const exp = payload.exp * 1000;

      // Check if token is expired
      if (Date.now() > exp) {
        this.signOut();
        return null;
      }

      return {
        email: payload.email,
        name: payload.name,
        sub: payload.sub
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  // Get ID token for API calls
  getIdToken() {
    return localStorage.getItem('idToken');
  },

  // Social login helpers
  googleSignIn() {
    const cognitoDomain = process.env.VITE_COGNITO_DOMAIN;
    const redirectUri = encodeURIComponent(window.location.origin + '/callback');
    const url =
      `https://${cognitoDomain}/oauth2/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=code&` +
      `scope=email+openid+profile&` +
      `redirect_uri=${redirectUri}&` +
      `identity_provider=Google`;

    window.location.href = url;
  },

  // Handle OAuth callback
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      return { success: false, error: 'No authorization code found' };
    }

    // Exchange code for tokens
    try {
      const cognitoDomain = process.env.VITE_COGNITO_DOMAIN;
      const response = await fetch(`https://${cognitoDomain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code: code,
          redirect_uri: window.location.origin + '/callback'
        })
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const tokens = await response.json();

      // Store tokens
      localStorage.setItem('idToken', tokens.id_token);
      localStorage.setItem('accessToken', tokens.access_token);
      localStorage.setItem('refreshToken', tokens.refresh_token);

      return { success: true };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return { success: false, error: error.message };
    }
  }
};
