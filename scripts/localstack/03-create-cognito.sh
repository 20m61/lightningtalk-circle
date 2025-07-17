#!/bin/bash
# LocalStack initialization script - Create Cognito User Pool
# This script runs automatically when LocalStack starts

echo "Creating Cognito User Pool in LocalStack..."

# Create User Pool
USER_POOL_ID=$(awslocal cognito-idp create-user-pool \
    --pool-name lightningtalk-local-users \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": true
        }
    }' \
    --auto-verified-attributes email \
    --username-attributes email \
    --mfa-configuration OFF \
    --region ap-northeast-1 \
    --query 'UserPool.Id' \
    --output text) || true

echo "User Pool ID: $USER_POOL_ID"

# Create User Pool Client
if [ ! -z "$USER_POOL_ID" ]; then
    CLIENT_ID=$(awslocal cognito-idp create-user-pool-client \
        --user-pool-id $USER_POOL_ID \
        --client-name lightningtalk-local-client \
        --generate-secret \
        --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
        --supported-identity-providers COGNITO \
        --allowed-o-auth-flows code \
        --allowed-o-auth-scopes openid email profile \
        --callback-urls http://localhost:3000/callback http://localhost:3001/callback \
        --logout-urls http://localhost:3000/logout http://localhost:3001/logout \
        --region ap-northeast-1 \
        --query 'UserPoolClient.ClientId' \
        --output text) || true
    
    echo "Client ID: $CLIENT_ID"
    
    # Create test user
    awslocal cognito-idp admin-create-user \
        --user-pool-id $USER_POOL_ID \
        --username admin@localhost \
        --user-attributes Name=email,Value=admin@localhost Name=email_verified,Value=true \
        --temporary-password TempPass123! \
        --message-action SUPPRESS \
        --region ap-northeast-1 || true
    
    # Set permanent password
    awslocal cognito-idp admin-set-user-password \
        --user-pool-id $USER_POOL_ID \
        --username admin@localhost \
        --password LocalAdmin123! \
        --permanent \
        --region ap-northeast-1 || true
    
    echo "Test user created: admin@localhost / LocalAdmin123!"
    
    # Save configuration
    echo "USER_POOL_ID=$USER_POOL_ID" > /tmp/cognito-config.env
    echo "CLIENT_ID=$CLIENT_ID" >> /tmp/cognito-config.env
fi

echo "Cognito setup completed!"