# Google OAuth Setup Guide

## Overview

This guide explains how to set up Google OAuth for the Lightning Talk Circle
application using AWS Cognito.

## Prerequisites

- Google Cloud Console access
- AWS CLI configured
- CDK deployment permissions

## Step 1: Create Google OAuth Credentials

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

### 1.2 Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Lightning Talk Circle"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if needed

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   ```
   https://lightningtalk-auth.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse
   https://発表.com/callback
   https://www.発表.com/callback
   http://localhost:3000/callback (for development)
   ```
5. Save the Client ID and Client Secret

## Step 2: Set Environment Variables

Create or update your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Existing Cognito Configuration
VITE_USER_POOL_ID=YOUR_SECURE_COGNITO_USER_POOL_ID
VITE_USER_POOL_CLIENT_ID=YOUR_SECURE_COGNITO_CLIENT_ID
VITE_IDENTITY_POOL_ID=YOUR_SECURE_COGNITO_IDENTITY_POOL_ID
VITE_COGNITO_DOMAIN=your-secure-cognito-domain.auth.ap-northeast-1.amazoncognito.com
```

## Step 3: Deploy Updated Cognito Stack

```bash
# Set environment variables for deployment
export GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your-google-client-secret

# Deploy the Cognito stack
cd cdk
npm run deploy cognito
```

## Step 4: Update Frontend Components

The LoginModal component already supports Google login. No additional changes
needed.

## Step 5: Test Google Login

1. Start the development server: `npm run dev`
2. Navigate to the login page
3. Click "Googleでログイン" button
4. Complete the OAuth flow
5. Verify successful authentication

## Security Notes

### Environment Variables

- Never commit Google credentials to version control
- Use AWS Secrets Manager or Parameter Store in production
- Rotate credentials regularly

### Domain Configuration

- Ensure all redirect URIs are properly configured
- Use HTTPS in production
- Validate all callback URLs

### User Data Handling

- Review Google's data usage policies
- Implement proper data retention policies
- Ensure GDPR compliance if applicable

## Troubleshooting

### Common Issues

1. **Invalid redirect URI**
   - Check that all URIs in Google Console match Cognito settings
   - Ensure proper encoding of internationalized domain names

2. **Provider not found**
   - Verify Google Identity Provider is properly configured in Cognito
   - Check that User Pool Client includes Google provider

3. **Scope errors**
   - Ensure requested scopes match those configured in Google Console
   - Verify OAuth consent screen is properly set up

### Debug Commands

```bash
# Check Cognito User Pool configuration
aws cognito-idp describe-user-pool --user-pool-id <USER_POOL_ID>

# List identity providers
aws cognito-idp list-identity-providers --user-pool-id <USER_POOL_ID>

# Check User Pool Client configuration
aws cognito-idp describe-user-pool-client --user-pool-id <USER_POOL_ID> --client-id <CLIENT_ID>
```

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [AWS Cognito External Identity Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/external-identity-providers.html)
- [Cognito Google Identity Provider](https://docs.aws.amazon.com/cognito/latest/developerguide/google.html)
