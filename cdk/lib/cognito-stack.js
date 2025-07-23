const { Stack, RemovalPolicy, Duration, SecretValue } = require('aws-cdk-lib');
const cognito = require('aws-cdk-lib/aws-cognito');
const lambda = require('aws-cdk-lib/aws-lambda');
const iam = require('aws-cdk-lib/aws-iam');

class CognitoStack extends Stack {
  constructor(scope, id, props = {}) {
    super(scope, id, props);
    
    const domainName = 'xn--6wym69a.com';
    const stage = props.config?.stage || 'dev';
    const isProd = stage === 'prod';
    
    // User Pool configuration based on environment
    const userPoolConfig = {
      userPoolName: `lightningtalk-users-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        organization: new cognito.StringAttribute({ mutable: true }),
        role: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      // MFA設定を追加
      mfa: isProd ? cognito.Mfa.REQUIRED : cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      userVerification: {
        emailSubject: 'Lightning Talk Circle - Verify your email',
        emailBody: 'Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
        smsMessage: 'Your Lightning Talk Circle verification code is {####}',
      },
      // Feature plan configuration
      featurePlan: isProd ? cognito.FeaturePlan.PLUS : cognito.FeaturePlan.ESSENTIALS,
    };
    
    // Add advanced security only for production with Plus plan
    if (isProd) {
      userPoolConfig.advancedSecurityMode = cognito.AdvancedSecurityMode.ENFORCED;
    }
    
    // User Pool
    const userPool = new cognito.UserPool(this, 'LightningTalkUserPool', userPoolConfig);
    
    // Google Identity Provider
    // Use existing Google OAuth secrets from AWS Secrets Manager
    const googleClientSecret = SecretValue.secretsManager(
      'lightningtalk-google-client-secret',
      {
        jsonField: 'clientSecret'
      }
    );
    
    // Get Google Client ID from Secrets Manager
    const googleClientId = SecretValue.secretsManager(
      'lightningtalk-google-client-id',
      {
        jsonField: 'clientId'
      }
    );
    
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
      userPool,
      clientId: googleClientId.unsafeUnwrap() || '853790608149-8jo0sestdodgdfju7gqb3snspe06bjom.apps.googleusercontent.com',
      clientSecretValue: googleClientSecret,
      scopes: ['email', 'profile', 'openid'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
      },
    });
    
    // User Pool Client (created after providers)
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'lightningtalk-web-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `https://${stage === 'dev' ? 'dev.' : ''}${domainName}/callback`,
          `https://www.${domainName}/callback`,
          'http://localhost:3000/callback', // Development
          'https://d3ciavsjxk30rq.cloudfront.net/callback', // CloudFront dev
        ],
        logoutUrls: [
          `https://${stage === 'dev' ? 'dev.' : ''}${domainName}`,
          `https://www.${domainName}`,
          'http://localhost:3000',
          'https://d3ciavsjxk30rq.cloudfront.net', // CloudFront dev
        ],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    });
    
    // Add dependency to ensure provider is created before client
    userPoolClient.node.addDependency(googleProvider);
    
    // User Pool Domain - use environment-specific domain prefix
    const userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool,
      cognitoDomain: {
        domainPrefix: `lightningtalk-auth-${stage}`,
      },
    });
    
    // Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `lightningtalk_identity_pool_${stage}`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: userPoolClient.userPoolClientId,
        providerName: userPool.userPoolProviderName,
      }],
    });
    
    // IAM Roles for Identity Pool
    const authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });
    
    authenticatedRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:Query',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
      ],
      resources: [
        `arn:aws:dynamodb:${this.region}:${this.account}:table/lightningtalk-*`,
      ],
    }));
    
    // Attach roles to Identity Pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
    });
    
    // Outputs
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
    this.identityPoolId = identityPool.ref;
    this.cognitoDomain = `${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`;
  }
}

module.exports = { CognitoStack };