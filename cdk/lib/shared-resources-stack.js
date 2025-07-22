/**
 * Lightning Talk Circle - Shared Resources Stack
 * 環境間で共有されるリソース（Cognito、DynamoDB、S3など）を管理
 */

const { Stack, Duration, RemovalPolicy, CfnOutput, Fn } = require('aws-cdk-lib');
const { Table, BillingMode, AttributeType, StreamViewType } = require('aws-cdk-lib/aws-dynamodb');
const { Bucket, BucketEncryption, BlockPublicAccess, ObjectOwnership } = require('aws-cdk-lib/aws-s3');
const { UserPool, UserPoolClient, CfnIdentityPool, CfnIdentityPoolRoleAttachment } = require('aws-cdk-lib/aws-cognito');
const { Role, FederatedPrincipal, PolicyStatement, Effect } = require('aws-cdk-lib/aws-iam');
const { Secret } = require('aws-cdk-lib/aws-secretsmanager');
const { StringParameter } = require('aws-cdk-lib/aws-ssm');

class SharedResourcesStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, environment } = props;
    const isProd = environment === 'prod';

    // Environment-specific sizing
    const sizing = {
      dev: {
        dynamodb: { billingMode: BillingMode.PAY_PER_REQUEST },
        cognito: { passwordMinLength: 8, mfa: false },
        s3: { lifecycleDays: 30 },
      },
      prod: {
        dynamodb: { 
          billingMode: BillingMode.PROVISIONED,
          readCapacity: 5,
          writeCapacity: 5,
        },
        cognito: { passwordMinLength: 12, mfa: true },
        s3: { lifecycleDays: 90 },
      },
    };

    const envConfig = sizing[environment] || sizing.dev;

    // Cognito User Pool
    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${config.projectName}-${environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: envConfig.cognito.passwordMinLength,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: 2, // Email and phone
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Cognito User Pool Client
    this.userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `${config.projectName}-${environment}-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: ['email', 'openid', 'profile'],
        callbackUrls: [
          `https://${config.domainName}/callback`,
          `https://api.${config.domainName}/callback`,
          ...(environment === 'dev' ? ['http://localhost:3000/callback'] : []),
        ],
        logoutUrls: [
          `https://${config.domainName}`,
          ...(environment === 'dev' ? ['http://localhost:3000'] : []),
        ],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    });

    // Cognito Identity Pool
    this.identityPool = new CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `${config.projectName}${environment}`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: this.userPoolClient.userPoolClientId,
        providerName: this.userPool.userPoolProviderName,
      }],
    });

    // DynamoDB Tables
    const tableConfig = {
      billingMode: envConfig.dynamodb.billingMode,
      ...(envConfig.dynamodb.billingMode === BillingMode.PROVISIONED ? {
        readCapacity: envConfig.dynamodb.readCapacity,
        writeCapacity: envConfig.dynamodb.writeCapacity,
      } : {}),
      pointInTimeRecovery: isProd,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    };

    // Events Table
    this.eventsTable = new Table(this, 'EventsTable', {
      tableName: `${config.projectName}-${environment}-events`,
      partitionKey: { name: 'eventId', type: AttributeType.STRING },
      sortKey: { name: 'createdAt', type: AttributeType.STRING },
      ...tableConfig,
    });

    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'statusIndex',
      partitionKey: { name: 'status', type: AttributeType.STRING },
      sortKey: { name: 'createdAt', type: AttributeType.STRING },
    });

    // Participants Table
    this.participantsTable = new Table(this, 'ParticipantsTable', {
      tableName: `${config.projectName}-${environment}-participants`,
      partitionKey: { name: 'participantId', type: AttributeType.STRING },
      sortKey: { name: 'eventId', type: AttributeType.STRING },
      ...tableConfig,
    });

    this.participantsTable.addGlobalSecondaryIndex({
      indexName: 'eventIndex',
      partitionKey: { name: 'eventId', type: AttributeType.STRING },
      sortKey: { name: 'createdAt', type: AttributeType.STRING },
    });

    // Talks Table
    this.talksTable = new Table(this, 'TalksTable', {
      tableName: `${config.projectName}-${environment}-talks`,
      partitionKey: { name: 'talkId', type: AttributeType.STRING },
      sortKey: { name: 'eventId', type: AttributeType.STRING },
      ...tableConfig,
    });

    // Users Table
    this.usersTable = new Table(this, 'UsersTable', {
      tableName: `${config.projectName}-${environment}-users`,
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      ...tableConfig,
    });

    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'emailIndex',
      partitionKey: { name: 'email', type: AttributeType.STRING },
    });

    // S3 Buckets
    const bucketConfig = {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      versioned: isProd,
      lifecycleRules: isProd ? [{
        id: 'delete-old-versions',
        enabled: true,
        noncurrentVersionExpiration: Duration.days(envConfig.s3.lifecycleDays),
      }] : [{
        id: 'delete-all',
        enabled: true,
        expiration: Duration.days(envConfig.s3.lifecycleDays),
      }],
    };

    // Uploads Bucket
    this.uploadsBucket = new Bucket(this, 'UploadsBucket', {
      bucketName: `${config.projectName}-${environment}-uploads`,
      ...bucketConfig,
      cors: [{
        allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3600,
      }],
    });

    // Static Assets Bucket
    this.assetsBucket = new Bucket(this, 'AssetsBucket', {
      bucketName: `${config.projectName}-${environment}-assets`,
      ...bucketConfig,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
    });

    // Secrets Manager
    this.appSecrets = new Secret(this, 'AppSecrets', {
      secretName: `${config.projectName}/${environment}/app-secrets`,
      description: `Application secrets for ${config.projectName} ${environment}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: '',
          SESSION_SECRET: '',
          GOOGLE_CLIENT_SECRET: '',
          EMAIL_SERVICE_API_KEY: '',
        }),
        generateStringKey: 'RANDOM_KEY',
        passwordLength: 32,
      },
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Store outputs in SSM for easy reference
    const ssmOutputs = {
      UserPoolId: this.userPool.userPoolId,
      UserPoolClientId: this.userPoolClient.userPoolClientId,
      IdentityPoolId: this.identityPool.ref,
      EventsTableName: this.eventsTable.tableName,
      ParticipantsTableName: this.participantsTable.tableName,
      TalksTableName: this.talksTable.tableName,
      UsersTableName: this.usersTable.tableName,
      UploadsBucketName: this.uploadsBucket.bucketName,
      AssetsBucketName: this.assetsBucket.bucketName,
      SecretsArn: this.appSecrets.secretArn,
    };

    Object.entries(ssmOutputs).forEach(([key, value]) => {
      new StringParameter(this, `SSM${key}`, {
        parameterName: `/${config.projectName}/${environment}/${key}`,
        stringValue: value,
      });
    });

    // CloudFormation Outputs
    Object.entries(ssmOutputs).forEach(([key, value]) => {
      new CfnOutput(this, key, {
        value: value,
        exportName: `${this.stackName}-${key}`,
        description: `${key} for ${environment} environment`,
      });
    });
  }
}

module.exports = { SharedResourcesStack };