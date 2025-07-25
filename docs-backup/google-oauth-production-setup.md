# Google OAuth Production Setup Guide

## 🚀 Production Deployment Instructions

This document provides step-by-step instructions for configuring Google OAuth
authentication in production.

## 📋 Prerequisites

- Access to Google Cloud Console
- AWS CLI with appropriate permissions
- Administrative access to the Lightning Talk Circle application

## 🔧 Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named "Lightning Talk Circle"
3. Enable the Google+ API

### 1.2 Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in application details:
   ```
   App name: Lightning Talk Circle
   User support email: admin@lightningtalk.example.com
   Developer contact: admin@lightningtalk.example.com
   ```
4. Add required scopes: `email`, `profile`, `openid`
5. Add authorized domains: `xn--6wym69a.com` (発表.com)

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Configure authorized redirect URIs:

   ```
   # Production URLs
   https://lightningtalk-auth-dev.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse
   https://d3ciavsjxk30rq.cloudfront.net/callback
   https://dev.xn--6wym69a.com/callback

   # For main production
   https://lightningtalk-auth.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse
   https://xn--6wym69a.com/callback
   https://www.xn--6wym69a.com/callback

   # Development (optional)
   http://localhost:3000/callback
   ```

5. Save the generated Client ID and Client Secret

## 🔐 Step 2: AWS Secrets Manager Configuration

### 2.1 Update Google Client ID

```bash
aws secretsmanager update-secret \
  --secret-id lightningtalk-google-client-id \
  --secret-string '{"clientId":"YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com"}'
```

### 2.2 Update Google Client Secret

```bash
aws secretsmanager update-secret \
  --secret-id lightningtalk-google-client-secret \
  --secret-string '{"clientSecret":"YOUR_ACTUAL_CLIENT_SECRET"}'
```

## ⚙️ Step 3: Update Cognito Configuration

### 3.1 Update Google Identity Provider

```bash
aws cognito-idp update-identity-provider \
  --user-pool-id ap-northeast-1_PHRdkumdl \
  --provider-name Google \
  --provider-details \
    client_id="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",\
    client_secret="YOUR_ACTUAL_CLIENT_SECRET",\
    authorize_scopes="email openid profile" \
  --attribute-mapping \
    email=email,name=name,family_name=family_name,given_name=given_name,picture=picture
```

### 3.2 Verify Configuration

```bash
# Check Identity Provider
aws cognito-idp describe-identity-provider \
  --user-pool-id ap-northeast-1_PHRdkumdl \
  --provider-name Google

# Check User Pool Client
aws cognito-idp describe-user-pool-client \
  --user-pool-id ap-northeast-1_PHRdkumdl \
  --client-id 5t48tpbh5qe26otojkfq1rf0ls
```

## 🧪 Step 4: Testing

### 4.1 Frontend Test URLs

- **Development**: https://d3ciavsjxk30rq.cloudfront.net
- **Custom Domain**: https://dev.xn--6wym69a.com

### 4.2 Test Google Login Flow

1. Navigate to the application
2. Click on "Event Management" (イベント管理)
3. In the admin login modal, click "管理者Googleアカウントでログイン"
4. Complete Google OAuth flow
5. Verify successful authentication and admin access

## 🛡️ Security Considerations

### Secret Management

- ✅ Google Client Secret stored in AWS Secrets Manager
- ✅ Client ID stored in AWS Secrets Manager
- ✅ Never commit credentials to version control
- ⚠️ Rotate credentials every 90 days

### Domain Security

- ✅ All redirect URIs use HTTPS in production
- ✅ International domain name (IDN) properly encoded
- ✅ Wildcard domains avoided in redirect URIs

### Access Control

- ✅ OAuth consent screen configured for external users
- ✅ Proper scopes requested (email, profile, openid)
- ✅ Attribute mapping configured correctly

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid redirect URI" Error

**Cause**: Mismatch between Google Console and Cognito redirect URIs  
**Solution**:

- Verify exact match in Google Console:
  `https://lightningtalk-auth-dev.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse`
- Check URL encoding for international domains

#### 2. "Provider not found" Error

**Cause**: Google Identity Provider not properly configured  
**Solution**:

```bash
# Verify provider exists
aws cognito-idp list-identity-providers --user-pool-id ap-northeast-1_PHRdkumdl

# Check client configuration
aws cognito-idp describe-user-pool-client \
  --user-pool-id ap-northeast-1_PHRdkumdl \
  --client-id 5t48tpbh5qe26otojkfq1rf0ls \
  --query 'UserPoolClient.SupportedIdentityProviders'
```

#### 3. "Scope errors"

**Cause**: Mismatch between requested and configured scopes  
**Solution**: Ensure scopes match in both Google Console and Cognito

### Debug Commands

```bash
# Test OAuth URL construction
echo "https://lightningtalk-auth-dev.auth.ap-northeast-1.amazoncognito.com/oauth2/authorize?client_id=5t48tpbh5qe26otojkfq1rf0ls&response_type=code&scope=email+openid+profile&redirect_uri=https%3A%2F%2Fd3ciavsjxk30rq.cloudfront.net%2Fcallback&identity_provider=Google"

# Check current configuration
aws cognito-idp describe-identity-provider \
  --user-pool-id ap-northeast-1_PHRdkumdl \
  --provider-name Google \
  --query 'IdentityProvider.ProviderDetails'
```

## 📚 References

- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [AWS Cognito External Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/external-identity-providers.html)
- [International Domain Names](https://en.wikipedia.org/wiki/Internationalized_domain_name)

## 📞 Support

For technical support, contact the development team or refer to:

- Application logs in CloudWatch
- AWS Cognito console for configuration verification
- Google Cloud Console for OAuth debugging

---

**Current Status**: ✅ Infrastructure configured with placeholder values  
**Next Step**: Update with actual Google OAuth credentials from Google Cloud
Console
