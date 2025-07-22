/**
 * Main Integrated Stack for Lightning Talk Circle
 * Consolidates all infrastructure into a single, environment-aware stack
 */

const cdk = require('aws-cdk-lib');
const { Construct } = require('constructs');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const targets = require('aws-cdk-lib/aws-route53-targets');
const cognito = require('aws-cdk-lib/aws-cognito');
const wafv2 = require('aws-cdk-lib/aws-wafv2');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const logs = require('aws-cdk-lib/aws-logs');
const iam = require('aws-cdk-lib/aws-iam');
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager');
const path = require('path');
const ssm = require('aws-cdk-lib/aws-ssm');

class LightningTalkMainStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environment, config } = props;
    const isProduction = environment === 'prod';
    const isDevelopment = environment === 'dev';
    
    // Domain configuration
    const baseDomain = 'xn--6wym69a.com'; // 発表.com
    const domainName = isDevelopment ? `dev.${baseDomain}` : baseDomain;
    
    // Tags for all resources
    const resourceTags = {
      Project: 'lightning-talk-circle',
      Environment: environment,
      ManagedBy: 'cdk',
      Domain: domainName,
    };

    // Apply tags to stack
    Object.entries(resourceTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // ===== SECRETS MANAGEMENT =====
    
    // Create secret for sensitive configuration
    const appSecrets = new secretsmanager.Secret(this, 'AppSecrets', {
      secretName: `lightningtalk-circle-${environment}-secrets`,
      description: `Application secrets for ${environment} environment`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: '',
          SESSION_SECRET: '',
          GOOGLE_CLIENT_SECRET: '',
        }),
        generateStringKey: 'JWT_SECRET',
        excludeCharacters: '"@/\\\'',
        includeSpace: false,
        requireEachIncludedType: true,
      },
    });

    // ===== COGNITO USER POOL =====
    
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `lightningtalk-${environment}-users`,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Lightning Talk Circle - メール認証',
        emailBody: '認証コード: {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: isProduction ? cognito.Mfa.OPTIONAL : cognito.Mfa.OFF,
      // standardThreatProtectionMode is not available in CDK v2.173.0
      // standardThreatProtectionMode: isProduction 
      //   ? cognito.StandardThreatProtectionMode.ENFORCED 
      //   : cognito.StandardThreatProtectionMode.DISABLED,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Client (Google OAuth will be added later)
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: `lightningtalk-${environment}-client`,
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          `https://${domainName}/callback`,
          ...(isDevelopment ? ['http://localhost:3000/callback'] : [])
        ],
        logoutUrls: [
          `https://${domainName}/logout`,
          ...(isDevelopment ? ['http://localhost:3000/logout'] : [])
        ],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        // Google OAuth will be added later
        // cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
    });

    // Identity Pool for AWS resource access
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `lightningtalk_${environment}_identity`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: userPoolClient.userPoolClientId,
        providerName: userPool.userPoolProviderName,
      }],
    });

    // ===== DYNAMODB TABLES =====

    // Events table
    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: `lightningtalk-${environment}-events`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.ON_DEMAND,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: isProduction,
      },
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for events by date
    eventsTable.addGlobalSecondaryIndex({
      indexName: 'date-index',
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Participants table
    const participantsTable = new dynamodb.Table(this, 'ParticipantsTable', {
      tableName: `lightningtalk-${environment}-participants`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.ON_DEMAND,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: isProduction,
      },
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    participantsTable.addGlobalSecondaryIndex({
      indexName: 'eventId-index',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Talks table
    const talksTable = new dynamodb.Table(this, 'TalksTable', {
      tableName: `lightningtalk-${environment}-talks`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.ON_DEMAND,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: isProduction,
      },
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    talksTable.addGlobalSecondaryIndex({
      indexName: 'eventId-index',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Users table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `lightningtalk-${environment}-users`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.ON_DEMAND,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: isProduction,
      },
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ===== S3 BUCKETS =====

    // Static assets bucket
    const staticBucket = new s3.Bucket(this, 'StaticBucket', {
      bucketName: `lightningtalk-${environment}-static-${cdk.Aws.ACCOUNT_ID}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProduction,
      versioned: isProduction,
      lifecycleRules: isProduction ? [{
        id: 'DeleteOldVersions',
        expiration: cdk.Duration.days(90),
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }] : [],
    });

    // Uploads bucket for user content
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `lightningtalk-${environment}-uploads-${cdk.Aws.ACCOUNT_ID}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProduction,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
        allowedOrigins: [`https://${domainName}`],
        allowedHeaders: ['*'],
      }],
    });

    // ===== LAMBDA FUNCTION =====

    // IAM role for Lambda
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions to Lambda
    eventsTable.grantReadWriteData(lambdaRole);
    participantsTable.grantReadWriteData(lambdaRole);
    talksTable.grantReadWriteData(lambdaRole);
    usersTable.grantReadWriteData(lambdaRole);
    staticBucket.grantReadWrite(lambdaRole);
    uploadsBucket.grantReadWrite(lambdaRole);
    appSecrets.grantRead(lambdaRole);
    
    // Grant Cognito permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminUpdateUserAttributes',
      ],
      resources: [userPool.userPoolArn],
    }));

    // Main API Lambda function
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `lightningtalk-${environment}-api`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../server')),
      timeout: cdk.Duration.seconds(30),
      memorySize: isProduction ? 1024 : 512,
      role: lambdaRole,
      environment: {
        NODE_ENV: environment === 'prod' ? 'production' : 'development',
        DATABASE_TYPE: 'dynamodb',
        EVENTS_TABLE: eventsTable.tableName,
        PARTICIPANTS_TABLE: participantsTable.tableName,
        TALKS_TABLE: talksTable.tableName,
        USERS_TABLE: usersTable.tableName,
        STATIC_BUCKET: staticBucket.bucketName,
        UPLOADS_BUCKET: uploadsBucket.bucketName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        SECRETS_ARN: appSecrets.secretArn,
        SITE_URL: `https://${domainName}`,
        CORS_ORIGINS: `https://${domainName}`,
        // Note: AWS_REGION is automatically provided by Lambda runtime
      },
      logGroup: new logs.LogGroup(this, 'ApiLogGroup', {
        logGroupName: `/aws/lambda/lightningtalk-${environment}-api-v2`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: isProduction ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      }),
    });

    // ===== API GATEWAY =====

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: `lightningtalk-${environment}-api`,
      description: `Lightning Talk Circle API - ${environment}`,
      defaultCorsPreflightOptions: {
        allowOrigins: [`https://${domainName}`],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
      deployOptions: {
        stageName: environment,
        throttlingRateLimit: isProduction ? 1000 : 100,
        throttlingBurstLimit: isProduction ? 2000 : 200,
        tracingEnabled: isProduction,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: !isProduction,
        metricsEnabled: true,
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // Add proxy resource to handle all API routes
    const apiResource = api.root.addResource('api');
    const proxyResource = apiResource.addResource('{proxy+}');
    proxyResource.addMethod('ANY', lambdaIntegration);
    
    // Handle root API path
    apiResource.addMethod('ANY', lambdaIntegration);

    // ===== SSL CERTIFICATE =====

    let certificate;
    if (isProduction) {
      // Production certificate for 発表.com
      certificate = new acm.Certificate(this, 'Certificate', {
        domainName: baseDomain,
        subjectAlternativeNames: [`*.${baseDomain}`],
        validation: acm.CertificateValidation.fromDns(),
      });
    } else {
      // Skip certificate for development to avoid DNS validation issues
      // CloudFront will use default domain
      certificate = null;
    }

    // ===== WAF (Production only) =====

    let webAcl;
    // TODO: WAF needs to be created in us-east-1 for CloudFront
    // Temporarily disabled WAF due to region requirements
    if (false) { // eslint-disable-line no-constant-condition
      webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
        name: `lightningtalk-${environment}-waf`,
        scope: 'CLOUDFRONT',
        defaultAction: { allow: {} },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'RateLimitRule',
            priority: 2,
            action: { block: {} },
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'RateLimitMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `lightningtalk-${environment}-waf`,
        },
      });
    }

    // ===== CLOUDFRONT DISTRIBUTION =====

    // Create Origin Access Identity for S3 bucket access
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: `OAI for ${domainName} - ${environment}`,
    });

    // Grant CloudFront OAI access to S3 bucket
    staticBucket.grantRead(originAccessIdentity);

    const distributionProps = {
      defaultBehavior: {
        origin: new origins.S3BucketOrigin(staticBucket, {
          originAccessIdentity: originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.RestApiOrigin(api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      webAclId: webAcl?.attrArn,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: isProduction 
        ? cloudfront.PriceClass.PRICE_CLASS_ALL 
        : cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      comment: `Lightning Talk Circle - ${environment}`,
    };

    // Add domain and certificate only for production or if certificate exists
    if (certificate) {
      distributionProps.domainNames = [domainName];
      distributionProps.certificate = certificate;
    }

    // Note: Creating new distribution with proper OAI configuration
    // Previous distribution will be replaced
    const distribution = new cloudfront.Distribution(this, 'DistributionV2', distributionProps);

    // ===== ROUTE 53 =====

    // Only create DNS records for production or when certificate is available
    if (certificate) {
      let hostedZone;
      // Use existing hosted zone for both production and development
      hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: baseDomain,
      });

      // A record for the domain
      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: isDevelopment ? 'dev' : undefined,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
    }

    // ===== MONITORING & ALARMS =====

    if (isProduction) {
      // API Gateway 4XX errors alarm
      new cloudwatch.Alarm(this, 'Api4XXAlarm', {
        alarmName: `lightningtalk-${environment}-api-4xx-errors`,
        metric: api.metricClientError(),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      // Lambda error rate alarm
      new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
        alarmName: `lightningtalk-${environment}-lambda-errors`,
        metric: apiFunction.metricErrors(),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      // CloudFront error rate alarm
      new cloudwatch.Alarm(this, 'CloudFrontErrorAlarm', {
        alarmName: `lightningtalk-${environment}-cloudfront-errors`,
        metric: distribution.metric4xxErrorRate(),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    }

    // ===== OUTPUTS =====

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'DomainUrl', {
      value: `https://${domainName}`,
      description: 'Custom Domain URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'StaticBucketName', {
      value: staticBucket.bucketName,
      description: 'S3 Static Assets Bucket Name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    // Store important values for cross-stack reference
    this.api = api;
    this.apiFunction = apiFunction;
    this.distribution = distribution;
    this.staticBucket = staticBucket;
    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
  }
}

module.exports = { LightningTalkMainStack };