/**
 * Development Environment Stack
 * Cost-optimized stack for development and testing
 */

const { Stack, Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const { Function, Runtime, Code, Architecture } = require('aws-cdk-lib/aws-lambda');
const { RestApi, LambdaIntegration, Cors } = require('aws-cdk-lib/aws-apigateway');
const { Table, BillingMode, AttributeType } = require('aws-cdk-lib/aws-dynamodb');
const { Bucket, BucketEncryption, BlockPublicAccess } = require('aws-cdk-lib/aws-s3');
const { Distribution, OriginAccessIdentity, ViewerProtocolPolicy, CachePolicy } = require('aws-cdk-lib/aws-cloudfront');
const { S3BucketOrigin } = require('aws-cdk-lib/aws-cloudfront-origins');
const { Secret } = require('aws-cdk-lib/aws-secretsmanager');
const { LogGroup, RetentionDays } = require('aws-cdk-lib/aws-logs');
const { Alarm, Metric, ComparisonOperator } = require('aws-cdk-lib/aws-cloudwatch');
const { Role, ServicePrincipal, PolicyStatement } = require('aws-cdk-lib/aws-iam');
const { Certificate } = require('aws-cdk-lib/aws-certificatemanager');

class DevEnvironmentStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { 
      environment = 'dev',
      domainConfig = {},
      enableMonitoring = true,
      enableCaching = false // Disabled for dev to save costs
    } = props;

    // =================================
    // DynamoDB Tables (Development)
    // =================================
    
    const eventsTable = new Table(this, 'EventsTable', {
      tableName: `lightningtalk-${environment}-events`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST, // Cost-effective for dev
      removalPolicy: RemovalPolicy.DESTROY, // Allow cleanup in dev
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false, // Disabled for dev
      },
    });

    const participantsTable = new Table(this, 'ParticipantsTable', {
      tableName: `lightningtalk-${environment}-participants`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
    });

    const usersTable = new Table(this, 'UsersTable', {
      tableName: `lightningtalk-${environment}-users`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
    });

    const talksTable = new Table(this, 'TalksTable', {
      tableName: `lightningtalk-${environment}-talks`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
    });

    // =================================
    // Secrets Management (Basic)
    // =================================
    
    const appSecrets = new Secret(this, 'AppSecrets', {
      secretName: `lightningtalk-${environment}-secrets`,
      description: 'Application secrets for development environment',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: '',
          SESSION_SECRET: '',
          EMAIL_SERVICE_KEY: '',
          GOOGLE_CLIENT_SECRET: ''
        }),
        generateStringKey: 'GENERATED_SECRET',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // =================================
    // Lambda API (Cost-optimized)
    // =================================
    
    const lambdaRole = new Role(this, 'LambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        { managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' }
      ],
    });

    // Grant DynamoDB permissions
    [eventsTable, participantsTable, usersTable, talksTable].forEach(table => {
      table.grantReadWriteData(lambdaRole);
    });

    // Grant Secrets Manager permissions
    appSecrets.grantRead(lambdaRole);

    const apiLambda = new Function(this, 'ApiLambda', {
      functionName: `lightningtalk-${environment}-api`,
      runtime: Runtime.NODEJS_20_X, // Updated runtime for ES Module support
      architecture: Architecture.ARM_64, // Cost-effective
      handler: 'lambda-handler.cjs.handler',
      code: Code.fromAsset('../server'),
      timeout: Duration.seconds(30),
      memorySize: 512, // Smaller memory for dev
      environment: {
        NODE_ENV: environment,
        DYNAMODB_EVENTS_TABLE: eventsTable.tableName,
        DYNAMODB_PARTICIPANTS_TABLE: participantsTable.tableName,
        DYNAMODB_USERS_TABLE: usersTable.tableName,
        DYNAMODB_TALKS_TABLE: talksTable.tableName,
        SECRETS_ARN: appSecrets.secretArn,
        // AWS_REGION is automatically available in Lambda runtime
      },
      role: lambdaRole,
    });

    // =================================
    // API Gateway
    // =================================
    
    const api = new RestApi(this, 'Api', {
      restApiName: `lightningtalk-${environment}-api`,
      description: 'Lightning Talk Circle API (Development)',
      defaultCorsPreflightOptions: {
        allowOrigins: [
          'http://localhost:3000',
          'http://localhost:8080',
          'http://localhost:5173', // Vite dev server
          `https://${domainConfig.domainName || 'xn--6wym69a.com'}`,
        ],
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS.concat(['x-api-key', 'Authorization']),
        allowCredentials: true,
      },
    });

    const lambdaIntegration = new LambdaIntegration(apiLambda);
    const apiResource = api.root.addResource('api');
    apiResource.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // =================================
    // Static Site (S3 + CloudFront)
    // =================================
    
    const staticBucket = new Bucket(this, 'StaticBucket', {
      bucketName: `lightningtalk-${environment}-static-${this.account}`,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Allow cleanup in dev
    });

    const originAccessIdentity = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${environment} static site`,
    });

    staticBucket.grantRead(originAccessIdentity);

    // Import existing SSL certificate
    const certificate = Certificate.fromCertificateArn(this, 'Certificate', 
      'arn:aws:acm:us-east-1:822063948773:certificate/42ab57fd-bb00-47c8-b218-fc23216e0f63'
    );

    const distribution = new Distribution(this, 'Distribution', {
      comment: `Lightning Talk Circle ${environment} distribution - SSL enabled`,
      domainNames: ['xn--6wym69a.com', 'www.xn--6wym69a.com'],
      certificate: certificate,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(staticBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: S3BucketOrigin.withOriginAccessIdentity(staticBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // =================================
    // Storybook Infrastructure (Dev)
    // =================================
    
    // S3 Bucket for Storybook Dev
    const storybookBucket = new Bucket(this, 'StorybookBucket', {
      bucketName: `lightning-talk-storybook-dev`,
      publicReadAccess: false, // Use OAI instead
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY, // Auto-delete in dev
      autoDeleteObjects: true,
      versioned: false, // No versioning in dev to save costs
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: ['GET', 'HEAD'],
          allowedOrigins: ['*'],
          exposedHeaders: [],
          maxAge: 3600,
        },
      ],
    });

    // OAI for Storybook
    const storybookOai = new OriginAccessIdentity(this, 'StorybookOAI', {
      comment: 'OAI for Storybook dev distribution',
    });

    storybookBucket.grantRead(storybookOai);

    // CloudFront for Storybook Dev
    const storybookDistribution = new Distribution(this, 'StorybookDistribution', {
      comment: 'Lightning Talk Circle Storybook Dev',
      domainNames: domainConfig?.domainName ? [`storybook.${domainConfig.domainName}`] : undefined,
      certificate: domainConfig?.domainName ? certificate : undefined,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(storybookBucket, {
          originAccessIdentity: storybookOai,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: enableCaching 
          ? CachePolicy.CACHING_OPTIMIZED 
          : CachePolicy.CACHING_DISABLED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // =================================
    // Basic Monitoring
    // =================================
    
    if (enableMonitoring) {
      const logGroup = new LogGroup(this, 'ApiLogGroup', {
        logGroupName: `/aws/lambda/${apiLambda.functionName}`,
        retention: RetentionDays.ONE_WEEK, // Short retention for dev
        removalPolicy: RemovalPolicy.DESTROY,
      });

      // Basic alarms
      const errorAlarm = new Alarm(this, 'ApiErrorAlarm', {
        alarmName: `${environment}-api-errors`,
        metric: apiLambda.metricErrors({
          statistic: 'Sum',
          period: Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      });

      const durationAlarm = new Alarm(this, 'ApiDurationAlarm', {
        alarmName: `${environment}-api-duration`,
        metric: apiLambda.metricDuration({
          statistic: 'Average',
          period: Duration.minutes(5),
        }),
        threshold: 10000, // 10 seconds
        evaluationPeriods: 3,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      });
    }

    // =================================
    // Outputs
    // =================================
    
    new CfnOutput(this, 'StorybookDistributionId', {
      value: storybookDistribution.distributionId,
      description: 'CloudFront Distribution ID for Storybook Dev',
    });

    new CfnOutput(this, 'StorybookBucket', {
      value: storybookBucket.bucketName,
      description: 'S3 Bucket for Storybook Dev',
    });
    
    new CfnOutput(this, 'StorybookURL', {
      value: `https://${storybookDistribution.distributionDomainName}`,
      description: 'Storybook Dev URL',
    });

    this.apiEndpoint = api.url;
    this.distributionDomain = distribution.distributionDomainName;
    this.staticBucketName = staticBucket.bucketName;
    this.secretsArn = appSecrets.secretArn;
    
    // Export values for cross-stack references
    this.tables = {
      events: eventsTable,
      participants: participantsTable,
      users: usersTable,
      talks: talksTable,
    };
  }
}

module.exports = { DevEnvironmentStack };