/**
 * Lightning Talk Circle - Screenshot Storage Stack
 * PR用スクリーンショット保存のためのS3バケットとポリシー管理
 */

const { Stack, Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const { Bucket, BlockPublicAccess, BucketEncryption, LifecycleRule, StorageClass } = require('aws-cdk-lib/aws-s3');
const { Role, ServicePrincipal, PolicyStatement, Effect, PolicyDocument } = require('aws-cdk-lib/aws-iam');
const { Function, Runtime, Code, Architecture } = require('aws-cdk-lib/aws-lambda');
const { LogGroup, RetentionDays } = require('aws-cdk-lib/aws-logs');
const { StringParameter } = require('aws-cdk-lib/aws-ssm');

class ScreenshotStorageStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, environment } = props;
    const isProd = environment === 'prod';

    // Environment-specific configurations
    const envConfig = {
      dev: {
        bucketName: `${config.projectName}-${environment}-screenshots`,
        lifecycleDays: 7, // 開発環境では7日で削除
        logRetention: RetentionDays.ONE_WEEK,
        maxFileSize: 10 * 1024 * 1024, // 10MB
      },
      prod: {
        bucketName: `${config.projectName}-${environment}-screenshots`,
        lifecycleDays: 30, // 本番環境では30日で削除
        logRetention: RetentionDays.ONE_MONTH,
        maxFileSize: 20 * 1024 * 1024, // 20MB
      },
    };

    const sizing = envConfig[environment] || envConfig.dev;

    // Screenshot storage bucket
    this.screenshotBucket = new Bucket(this, 'ScreenshotBucket', {
      bucketName: sizing.bucketName,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      lifecycleRules: [
        {
          id: 'DeleteOldScreenshots',
          enabled: true,
          expiration: Duration.days(sizing.lifecycleDays),
          transitions: [
            {
              storageClass: StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(1),
            },
          ],
        },
      ],
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: ['GET', 'PUT', 'POST'],
          allowedOrigins: ['*'], // 本番では特定のドメインに制限することを推奨
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
    });

    // Lambda execution role for presigned URL generation
    const presignedUrlLambdaRole = new Role(this, 'PresignedUrlLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        {
          managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        },
      ],
      inlinePolicies: {
        S3PresignedUrlPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:DeleteObject',
              ],
              resources: [
                this.screenshotBucket.bucketArn,
                `${this.screenshotBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Lambda log group
    const presignedUrlLogGroup = new LogGroup(this, 'PresignedUrlLogGroup', {
      logGroupName: `/aws/lambda/${config.projectName}-${environment}-presigned-url`,
      retention: sizing.logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Lambda function for generating presigned URLs
    this.presignedUrlFunction = new Function(this, 'PresignedUrlFunction', {
      functionName: `${config.projectName}-${environment}-presigned-url`,
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      handler: 'presigned-url.handler',
      code: Code.fromAsset('lambda/presigned-url'),
      role: presignedUrlLambdaRole,
      logGroup: presignedUrlLogGroup,
      timeout: Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: environment,
        BUCKET_NAME: this.screenshotBucket.bucketName,
        MAX_FILE_SIZE: sizing.maxFileSize.toString(),
        EXPIRY_SECONDS: '3600', // 1 hour
        ALLOWED_EXTENSIONS: 'png,jpg,jpeg,gif,webp',
      },
    });

    // Store bucket name in SSM for other stacks to reference
    new StringParameter(this, 'ScreenshotBucketNameParam', {
      parameterName: `/${config.projectName}/${environment}/screenshot-bucket-name`,
      stringValue: this.screenshotBucket.bucketName,
      description: 'Screenshot storage bucket name',
    });

    // Store Lambda function ARN in SSM
    new StringParameter(this, 'PresignedUrlFunctionArnParam', {
      parameterName: `/${config.projectName}/${environment}/presigned-url-function-arn`,
      stringValue: this.presignedUrlFunction.functionArn,
      description: 'Presigned URL Lambda function ARN',
    });

    // Outputs
    new CfnOutput(this, 'ScreenshotBucketName', {
      value: this.screenshotBucket.bucketName,
      description: 'Screenshot storage bucket name',
      exportName: `${config.projectName}-${environment}-screenshot-bucket`,
    });

    new CfnOutput(this, 'PresignedUrlFunctionArn', {
      value: this.presignedUrlFunction.functionArn,
      description: 'Presigned URL Lambda function ARN',
      exportName: `${config.projectName}-${environment}-presigned-url-function`,
    });

    new CfnOutput(this, 'ScreenshotBucketArn', {
      value: this.screenshotBucket.bucketArn,
      description: 'Screenshot storage bucket ARN',
    });
  }
}

module.exports = { ScreenshotStorageStack };