const { Stack, RemovalPolicy, Duration } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const iam = require('aws-cdk-lib/aws-iam');

class StaticSiteStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, apiUrl } = props;

    // Create S3 bucket for static assets
    const staticBucket = new s3.Bucket(this, 'StaticSiteBucket', {
      bucketName: `${config.app.name}-static-${config.app.stage}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: config.app.stage === 'production' 
        ? RemovalPolicy.RETAIN 
        : RemovalPolicy.DESTROY,
      autoDeleteObjects: config.app.stage !== 'production',
      versioned: config.app.stage === 'production',
      cors: [{
        allowedHeaders: ['*'],
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
        allowedOrigins: ['*'],
        maxAge: 3600,
      }],
    });

    // Create CloudFront Origin Access Identity
    const oai = new cloudfront.OriginAccessIdentity(this, 'StaticSiteOAI', {
      comment: `OAI for ${config.app.name} static site`,
    });

    // Grant read permissions to CloudFront
    staticBucket.grantRead(oai);

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'StaticSiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(staticBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(apiUrl.replace('http://', ''), {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(0),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      enabled: true,
      comment: `${config.app.name} static site distribution`,
    });

    // Deploy static files to S3
    new s3deploy.BucketDeployment(this, 'DeployStaticSite', {
      sources: [s3deploy.Source.asset('../public')],
      destinationBucket: staticBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Output the CloudFront URL
    this.distributionUrl = `https://${distribution.distributionDomainName}`;
    this.distributionId = distribution.distributionId;
  }
}

module.exports = { StaticSiteStack };