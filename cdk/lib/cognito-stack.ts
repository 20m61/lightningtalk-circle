import { 
  Stack, 
  StackProps, 
  RemovalPolicy, 
  Duration, 
  SecretValue,
  CfnOutput 
} from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface CognitoStackProps extends StackProps {
  domainName?: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

export class CognitoStack extends Stack {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly identityPoolId: string;
  public readonly cognitoDomain: string;

  constructor(scope: Construct, id: string, props: CognitoStackProps = {}) {
    super(scope, id, props);
    
    const domainName = props.domainName || 'xn--6wym69a.com';
    
    // User Pool
    const userPool = new cognito.UserPool(this, 'LightningTalkUserPool', {
      userPoolName: 'lightningtalk-users',
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
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    
    // Google Identity Provider
    // Best practice: Use Secrets Manager for sensitive values in production
    const googleClientSecret = props.googleClientSecret
      ? SecretValue.unsafePlainText(props.googleClientSecret)
      : SecretValue.secretsManager('lightningtalk-google-client-secret', {
          jsonField: 'clientSecret'
        });
    
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
      userPool,
      clientId: props.googleClientId || process.env.GOOGLE_CLIENT_ID || 'placeholder-google-client-id',
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
          `https://${domainName}/callback`,
          `https://www.${domainName}/callback`,
          'http://localhost:3000/callback', // Development
        ],
        logoutUrls: [
          `https://${domainName}`,
          `https://www.${domainName}`,
          'http://localhost:3000',
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
    
    // User Pool Domain
    const userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool,
      cognitoDomain: {
        domainPrefix: 'lightningtalk-auth-v2',
      },
    });
    
    // Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: 'lightningtalk_identity_pool',
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
    
    // Stack outputs
    new CfnOutput(this, 'UserPoolId', {
      value: this.userPoolId,
      description: 'Cognito User Pool ID',
    });
    
    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
    
    new CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPoolId,
      description: 'Cognito Identity Pool ID',
    });
    
    new CfnOutput(this, 'CognitoDomain', {
      value: this.cognitoDomain,
      description: 'Cognito Hosted UI Domain',
    });
  }
}