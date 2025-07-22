/**
 * Lightning Talk Circle - Storybook Development Stack
 * Standalone stack for Storybook hosting in development environment
 */

const cdk = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const iam = require('aws-cdk-lib/aws-iam');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const { RemovalPolicy, Duration } = require('aws-cdk-lib');

class StorybookDevStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environment = 'dev' } = props;

    // S3 Bucket for Storybook Static Files
    this.bucket = new s3.Bucket(this, 'StorybookBucket', {
      bucketName: `lightning-talk-storybook-${environment}-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          exposedHeaders: [],
          maxAge: 3600,
        },
      ],
    });

    // Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for Storybook ${environment}`,
    });

    // Grant read access to OAI
    this.bucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
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
        origin: new origins.S3BucketOrigin(this.bucket, {
          originAccessIdentity,
        }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      comment: `Lightning Talk Circle Storybook - ${environment}`,
    });

    // Deploy Storybook static files to S3
    new s3deploy.BucketDeployment(this, 'DeployStorybook', {
      sources: [s3deploy.Source.asset('../lightningtalk-modern/packages/components/storybook-static')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      memoryLimit: 512,
    });

    // Outputs
    new cdk.CfnOutput(this, 'StorybookBucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket for Storybook static files',
    });

    new cdk.CfnOutput(this, 'StorybookURL', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Storybook URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID for cache invalidation',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    // Tags
    cdk.Tags.of(this).add('Project', 'Lightning Talk Circle');
    cdk.Tags.of(this).add('Component', 'Storybook');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}

module.exports = { StorybookDevStack };