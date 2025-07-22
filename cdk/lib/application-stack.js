/**
 * Lightning Talk Circle - Application Stack
 * アプリケーション層のリソース（Lambda、API Gateway、CloudFront等）を管理
 */

const { Stack, Duration, RemovalPolicy, CfnOutput, Fn } = require('aws-cdk-lib');
const { Function, Runtime, Code, Architecture, LayerVersion } = require('aws-cdk-lib/aws-lambda');
const { RestApi, LambdaIntegration, Cors, AuthorizationType, CognitoUserPoolsAuthorizer } = require('aws-cdk-lib/aws-apigateway');
const { Distribution, OriginAccessIdentity, ViewerProtocolPolicy, CachePolicy, ResponseHeadersPolicy, PriceClass, OriginRequestPolicy } = require('aws-cdk-lib/aws-cloudfront');
const { S3BucketOrigin, HttpOrigin } = require('aws-cdk-lib/aws-cloudfront-origins');
const { Bucket } = require('aws-cdk-lib/aws-s3');
const { BucketDeployment, Source } = require('aws-cdk-lib/aws-s3-deployment');
const { Role, ServicePrincipal, PolicyStatement, Effect, ManagedPolicy } = require('aws-cdk-lib/aws-iam');
const { LogGroup, RetentionDays } = require('aws-cdk-lib/aws-logs');
const { StringParameter } = require('aws-cdk-lib/aws-ssm');
const { ARecord, RecordTarget, HostedZone } = require('aws-cdk-lib/aws-route53');
const { CloudFrontTarget } = require('aws-cdk-lib/aws-route53-targets');
const { Certificate } = require('aws-cdk-lib/aws-certificatemanager');

class ApplicationStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, environment, sharedResources, certificateArn } = props;
    const isProd = environment === 'prod';

    // Environment-specific configurations
    const envConfig = {
      dev: {
        lambda: {
          memorySize: 512,
          timeout: Duration.seconds(30),
          reservedConcurrentExecutions: undefined,
        },
        api: {
          throttle: { rateLimit: 100, burstLimit: 200 },
        },
        cloudfront: {
          priceClass: PriceClass.PRICE_CLASS_100,
          cachePolicies: {
            static: CachePolicy.CACHING_OPTIMIZED,
            api: CachePolicy.CACHING_DISABLED,
          },
        },
        logRetention: RetentionDays.ONE_WEEK,
      },
      prod: {
        lambda: {
          memorySize: 1024,
          timeout: Duration.seconds(60),
          reservedConcurrentExecutions: 10,
        },
        api: {
          throttle: { rateLimit: 1000, burstLimit: 2000 },
        },
        cloudfront: {
          priceClass: PriceClass.PRICE_CLASS_ALL,
          cachePolicies: {
            static: CachePolicy.CACHING_OPTIMIZED,
            api: CachePolicy.fromCachePolicyId(this, 'APICachePolicy', '4135ea2d-6df8-44a3-9df3-4b5a84be39ad'), // Managed-CachingOptimizedForUncompressedObjects
          },
        },
        logRetention: RetentionDays.THREE_MONTHS,
      },
    };

    const sizing = envConfig[environment] || envConfig.dev;

    // Get shared resources from SSM
    const getSSMValue = (key) => StringParameter.valueForStringParameter(this, `/${config.projectName}/${environment}/${key}`);

    // Static hosting bucket
    this.staticBucket = new Bucket(this, 'StaticBucket', {
      bucketName: `${config.projectName}-${environment}-static`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: Bucket.BLOCK_PUBLIC_ACCESS_BLOCK_ACLS,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      versioned: isProd,
    });

    // Lambda Layer for dependencies
    this.dependenciesLayer = new LayerVersion(this, 'DependenciesLayer', {
      code: Code.fromAsset('layers/dependencies'),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
      description: 'Common dependencies for Lambda functions',
      layerVersionName: `${config.projectName}-${environment}-dependencies`,
    });

    // Lambda execution role
    const lambdaRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:BatchGetItem',
            'dynamodb:BatchWriteItem',
          ],
          resources: [
            `arn:aws:dynamodb:${this.region}:${this.account}:table/${config.projectName}-${environment}-*`,
            `arn:aws:dynamodb:${this.region}:${this.account}:table/${config.projectName}-${environment}-*/index/*`,
          ],
        }),
        S3Access: new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          resources: [
            `arn:aws:s3:::${config.projectName}-${environment}-*`,
            `arn:aws:s3:::${config.projectName}-${environment}-*/*`,
          ],
        }),
        SecretsAccess: new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
          ],
          resources: [
            getSSMValue('SecretsArn'),
          ],
        }),
        CognitoAccess: new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'cognito-idp:AdminGetUser',
            'cognito-idp:AdminCreateUser',
            'cognito-idp:AdminUpdateUserAttributes',
            'cognito-idp:AdminDeleteUser',
          ],
          resources: [
            `arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${getSSMValue('UserPoolId')}`,
          ],
        }),
      },
    });

    // Lambda log group
    const lambdaLogGroup = new LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${config.projectName}-${environment}-api`,
      retention: sizing.logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Main API Lambda function
    this.apiFunction = new Function(this, 'APIFunction', {
      functionName: `${config.projectName}-${environment}-api`,
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      code: Code.fromAsset('../server', {
        exclude: ['node_modules', '.git', 'tests', '*.test.js'],
      }),
      layers: [this.dependenciesLayer],
      role: lambdaRole,
      logGroup: lambdaLogGroup,
      environment: {
        NODE_ENV: environment,
        REGION: this.region,
        // DynamoDB Tables
        EVENTS_TABLE: getSSMValue('EventsTableName'),
        PARTICIPANTS_TABLE: getSSMValue('ParticipantsTableName'),
        TALKS_TABLE: getSSMValue('TalksTableName'),
        USERS_TABLE: getSSMValue('UsersTableName'),
        // S3 Buckets
        UPLOADS_BUCKET: getSSMValue('UploadsBucketName'),
        ASSETS_BUCKET: getSSMValue('AssetsBucketName'),
        // Cognito
        USER_POOL_ID: getSSMValue('UserPoolId'),
        USER_POOL_CLIENT_ID: getSSMValue('UserPoolClientId'),
        IDENTITY_POOL_ID: getSSMValue('IdentityPoolId'),
        // Secrets
        SECRETS_ARN: getSSMValue('SecretsArn'),
        // App Config
        SITE_URL: `https://${config.domainName}`,
        API_URL: `https://api.${config.domainName}`,
      },
      ...sizing.lambda,
    });

    // API Gateway
    this.api = new RestApi(this, 'API', {
      restApiName: `${config.projectName}-${environment}`,
      description: `Lightning Talk Circle API - ${environment}`,
      deployOptions: {
        stageName: environment,
        throttlingRateLimit: sizing.api.throttle.rateLimit,
        throttlingBurstLimit: sizing.api.throttle.burstLimit,
        loggingLevel: isProd ? 'ERROR' : 'INFO',
        dataTraceEnabled: !isProd,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
        allowCredentials: true,
      },
    });

    // Cognito Authorizer
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'APIAuthorizer', {
      cognitoUserPools: [sharedResources.userPool],
      authorizerName: `${config.projectName}-${environment}-authorizer`,
      identitySource: 'method.request.header.Authorization',
    });

    // API Routes
    const apiIntegration = new LambdaIntegration(this.apiFunction);
    
    // Public routes
    this.api.root.addProxy({
      defaultIntegration: apiIntegration,
      anyMethod: true,
    });

    // Protected routes
    const protectedResource = this.api.root.addResource('protected');
    protectedResource.addProxy({
      defaultIntegration: apiIntegration,
      anyMethod: true,
      defaultMethodOptions: {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: authorizer,
      },
    });

    // CloudFront Origin Access Identity
    const oai = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${config.projectName} ${environment}`,
    });

    this.staticBucket.grantRead(oai);

    // CloudFront Distribution
    this.distribution = new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(300),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(300),
        },
      ],
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(this.staticBucket, {
          originAccessIdentity: oai,
        }),
        compress: true,
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: sizing.cloudfront.cachePolicies.static,
        responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new HttpOrigin(`${this.api.restApiId}.execute-api.${this.region}.amazonaws.com`, {
            originPath: `/${environment}`,
          }),
          compress: true,
          allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
          viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: sizing.cloudfront.cachePolicies.api,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      priceClass: sizing.cloudfront.priceClass,
      httpVersion: 'http2and3',
      minimumProtocolVersion: 'TLSv1.2_2021',
      certificate: certificateArn ? Certificate.fromCertificateArn(this, 'Certificate', certificateArn) : undefined,
      domainNames: certificateArn ? [config.domainName, `www.${config.domainName}`] : undefined,
      comment: `${config.projectName} ${environment} distribution`,
    });

    // Route53 Records (if certificate is provided)
    if (certificateArn && config.hostedZoneId) {
      const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: config.hostedZoneId,
        zoneName: config.domainName,
      });

      // Main domain
      new ARecord(this, 'ARecord', {
        zone: hostedZone,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        recordName: config.domainName,
      });

      // WWW subdomain
      new ARecord(this, 'WWWARecord', {
        zone: hostedZone,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        recordName: `www.${config.domainName}`,
      });

      // API subdomain
      new ARecord(this, 'APIARecord', {
        zone: hostedZone,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        recordName: `api.${config.domainName}`,
      });
    }

    // Deploy static assets
    new BucketDeployment(this, 'DeployStaticAssets', {
      sources: [Source.asset('../public')],
      destinationBucket: this.staticBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      memoryLimit: 512,
      retainOnDelete: isProd,
    });

    // Outputs
    new CfnOutput(this, 'DistributionURL', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new CfnOutput(this, 'APIEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
    });

    new CfnOutput(this, 'StaticBucketName', {
      value: this.staticBucket.bucketName,
      description: 'Static hosting S3 bucket name',
    });
  }
}

module.exports = { ApplicationStack };