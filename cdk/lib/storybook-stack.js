/**
 * Lightning Talk Circle - Storybook Infrastructure Stack
 * 統合デザインシステムのStorybookホスティング基盤
 */

const cdk = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const iam = require('aws-cdk-lib/aws-iam');
const { RemovalPolicy, Duration } = require('aws-cdk-lib');

class StorybookStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { domainName, environment, certificateArn, hostedZoneId } = props;
    const subdomain = environment === 'production' ? 'storybook' : 'storybook-staging';
    const fullDomain = `${subdomain}.${domainName}`;

    // S3 Bucket for Storybook Static Files
    this.bucket = new s3.Bucket(this, 'StorybookBucket', {
      bucketName: `lightning-talk-storybook-${environment}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(30),
        },
      ],
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

    // Bucket Policy for CloudFront Access
    const bucketPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${this.bucket.bucketArn}/*`],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
    });

    this.bucket.addToResourcePolicy(bucketPolicy);

    // Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${fullDomain}`,
    });

    // CloudFront Distribution
    const distributionConfig = {
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
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity,
        }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'LogsBucket', {
        bucketName: `lightning-talk-storybook-logs-${environment}`,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            expiration: Duration.days(30),
          },
        ],
      }),
      comment: `Lightning Talk Circle Storybook - ${environment}`,
    };

    // Add custom domain if certificate is provided
    if (certificateArn) {
      const certificate = acm.Certificate.fromCertificateArn(
        this,
        'Certificate',
        certificateArn
      );
      
      distributionConfig.domainNames = [fullDomain];
      distributionConfig.certificate = certificate;
    }

    this.distribution = new cloudfront.Distribution(this, 'Distribution', distributionConfig);
    this.distributionId = this.distribution.distributionId;

    // Route53 Record (if hosted zone is provided)
    if (hostedZoneId && certificateArn) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId,
        zoneName: domainName,
      });

      new route53.CnameRecord(this, 'StorybookCNAME', {
        zone: hostedZone,
        recordName: subdomain,
        domainName: this.distribution.distributionDomainName,
        ttl: Duration.minutes(5),
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'StorybookBucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket for Storybook static files',
    });

    new cdk.CfnOutput(this, 'StorybookURL', {
      value: certificateArn ? `https://${fullDomain}` : `https://${this.distribution.distributionDomainName}`,
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

module.exports = { StorybookStack };