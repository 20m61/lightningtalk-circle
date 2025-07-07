const { Stack, RemovalPolicy, Duration, CfnOutput } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const iam = require('aws-cdk-lib/aws-iam');
const route53 = require('aws-cdk-lib/aws-route53');
const targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');

class StaticSiteStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, apiUrl } = props;
    
    // Custom domain configuration
    const customDomain = config.domain;
    let hostedZone, certificate;

    // Set up custom domain if provided
    if (customDomain && customDomain.domainName) {
      // Look up existing hosted zone
      if (customDomain.hostedZoneId) {
        hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
          hostedZoneId: customDomain.hostedZoneId,
          zoneName: customDomain.zoneName || customDomain.domainName,
        });
      } else if (customDomain.zoneName) {
        hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
          domainName: customDomain.zoneName,
        });
      }

      // Create or reference SSL certificate
      if (customDomain.certificateArn) {
        certificate = acm.Certificate.fromCertificateArn(
          this,
          'Certificate',
          customDomain.certificateArn
        );
      } else if (hostedZone) {
        certificate = new acm.Certificate(this, 'Certificate', {
          domainName: customDomain.domainName,
          subjectAlternativeNames: customDomain.alternativeNames || [],
          validation: acm.CertificateValidation.fromDns(hostedZone),
        });
      }
    }

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

    // CloudFront distribution configuration
    const distributionConfig = {
      defaultBehavior: {
        origin: new origins.S3Origin(staticBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
          responseHeadersPolicyName: `${config.app.name}-security-headers-${config.app.stage}`,
          comment: 'Security headers for Lightning Talk Circle',
          securityHeadersConfig: {
            contentTypeOptions: {
              override: true,
            },
            frameOptions: {
              frameOption: cloudfront.HeadersFrameOption.DENY,
              override: true,
            },
            referrerPolicy: {
              referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
              override: true,
            },
            strictTransportSecurity: {
              accessControlMaxAge: Duration.seconds(63072000), // 2 years
              includeSubdomains: true,
              preload: true,
              override: true,
            },
            xssProtection: {
              protection: true,
              modeBlock: true,
              override: true,
            },
          },
          customHeadersConfig: {
            customHeaders: [
              {
                header: 'Content-Security-Policy',
                value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.github.com",
                override: true,
              },
              {
                header: 'Permissions-Policy',
                value: 'camera=(), microphone=(), geolocation=(self)',
                override: true,
              },
            ],
          },
        }),
      },
      webAclId: props.wafAclArn,
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
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      enableIpv6: true,
    };

    // Add custom domain configuration if available
    if (customDomain && customDomain.domainName && certificate) {
      distributionConfig.domainNames = [customDomain.domainName];
      if (customDomain.alternativeNames) {
        distributionConfig.domainNames.push(...customDomain.alternativeNames);
      }
      distributionConfig.certificate = certificate;
      distributionConfig.minimumProtocolVersion = cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021;
    }

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'StaticSiteDistribution', distributionConfig);

    // Deploy static files to S3
    new s3deploy.BucketDeployment(this, 'DeployStaticSite', {
      sources: [s3deploy.Source.asset('../public')],
      destinationBucket: staticBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Create Route53 records for custom domain
    if (hostedZone && customDomain && customDomain.domainName) {
      // A record for apex domain
      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: customDomain.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
        ttl: Duration.seconds(300),
      });

      // AAAA record for IPv6
      new route53.AaaaRecord(this, 'AliasRecordAAAA', {
        zone: hostedZone,
        recordName: customDomain.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
        ttl: Duration.seconds(300),
      });

      // Alternative names (e.g., www subdomain)
      if (customDomain.alternativeNames) {
        customDomain.alternativeNames.forEach((altName, index) => {
          new route53.ARecord(this, `AliasRecord${index + 1}`, {
            zone: hostedZone,
            recordName: altName,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
            ttl: Duration.seconds(300),
          });

          new route53.AaaaRecord(this, `AliasRecordAAAA${index + 1}`, {
            zone: hostedZone,
            recordName: altName,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
            ttl: Duration.seconds(300),
          });
        });
      }
    }

    // Set up properties for outputs
    this.distributionUrl = customDomain && customDomain.domainName 
      ? `https://${customDomain.domainName}`
      : `https://${distribution.distributionDomainName}`;
    this.distributionId = distribution.distributionId;
    this.bucketName = staticBucket.bucketName;
    this.certificateArn = certificate?.certificateArn;

    // CloudFormation Outputs
    new CfnOutput(this, 'StaticSiteUrl', {
      value: this.distributionUrl,
      description: 'URL of the static site',
      exportName: `${config.app.name}-${config.app.stage}-static-site-url`,
    });

    new CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `${config.app.name}-${config.app.stage}-distribution-id`,
    });

    new CfnOutput(this, 'S3BucketName', {
      value: this.bucketName,
      description: 'S3 Bucket name for static assets',
      exportName: `${config.app.name}-${config.app.stage}-bucket-name`,
    });

    if (certificate) {
      new CfnOutput(this, 'SSLCertificateArn', {
        value: this.certificateArn,
        description: 'SSL Certificate ARN',
        exportName: `${config.app.name}-${config.app.stage}-certificate-arn`,
      });
    }

    if (customDomain && customDomain.domainName) {
      new CfnOutput(this, 'CustomDomain', {
        value: customDomain.domainName,
        description: 'Custom domain name',
        exportName: `${config.app.name}-${config.app.stage}-custom-domain`,
      });
    }
  }
}

module.exports = { StaticSiteStack };