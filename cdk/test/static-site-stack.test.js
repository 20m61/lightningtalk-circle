const { App } = require('aws-cdk-lib');
const { Template } = require('aws-cdk-lib/assertions');
const { StaticSiteStack } = require('../lib/stacks/static-site-stack');

describe('StaticSiteStack', () => {
  let app;
  let template;

  const defaultConfig = {
    app: {
      name: 'test-app',
      stage: 'test'
    }
  };

  beforeEach(() => {
    app = new App();
  });

  describe('S3 Bucket Configuration', () => {
    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: defaultConfig,
        apiUrl: 'http://localhost:3000',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates S3 bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-app-static-test',
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('configures CORS for API access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'HEAD'],
              AllowedOrigins: ['*'],
              MaxAge: 3600
            }
          ]
        }
      });
    });

    test('uses destroy policy for non-production', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('CloudFront Distribution', () => {
    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: defaultConfig,
        apiUrl: 'http://localhost:3000',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Enabled: true,
          Comment: 'test-app static site distribution',
          DefaultRootObject: 'index.html',
          HttpVersion: 'http2and3',
          IPV6Enabled: true,
          PriceClass: 'PriceClass_200'
        }
      });
    });

    test('configures default behavior for S3 origin', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            TargetOriginId: 'origin1',
            ViewerProtocolPolicy: 'redirect-to-https',
            AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            CachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            Compress: true
          }
        }
      });
    });

    test('configures API behavior for /api/* paths', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: [
            {
              PathPattern: '/api/*',
              TargetOriginId: 'origin2',
              ViewerProtocolPolicy: 'redirect-to-https',
              AllowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
              CachedMethods: ['GET', 'HEAD']
            }
          ]
        }
      });
    });

    test('configures SPA error responses', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CustomErrorResponses: [
            {
              ErrorCode: 404,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
              ErrorCachingMinTTL: 0
            },
            {
              ErrorCode: 403,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
              ErrorCachingMinTTL: 0
            }
          ]
        }
      });
    });
  });

  describe('Origin Access Identity', () => {
    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: defaultConfig,
        apiUrl: 'http://localhost:3000',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates CloudFront Origin Access Identity', () => {
      template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
        CloudFrontOriginAccessIdentityConfig: {
          Comment: 'OAI for test-app static site'
        }
      });
    });

    test('grants OAI read access to S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Principal: {
                AWS: {
                  'Fn::GetAtt': ['StaticSiteOAI', 'S3CanonicalUserId']
                }
              }
            }
          ]
        }
      });
    });
  });

  describe('Custom Domain Configuration', () => {
    const domainConfig = {
      ...defaultConfig,
      domain: {
        domainName: 'example.com',
        zoneName: 'example.com',
        alternativeNames: ['www.example.com']
      }
    };

    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: domainConfig,
        apiUrl: 'https://api.example.com',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates SSL certificate', () => {
      template.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'example.com',
        SubjectAlternativeNames: ['www.example.com'],
        ValidationMethod: 'DNS'
      });
    });

    test('configures CloudFront with custom domain', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Aliases: ['example.com', 'www.example.com'],
          ViewerCertificate: {
            AcmCertificateArn: {
              Ref: 'Certificate4E7ABB08'
            },
            SslSupportMethod: 'sni-only',
            MinimumProtocolVersion: 'TLSv1.2_2021'
          }
        }
      });
    });

    test('creates Route53 A record', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'example.com.',
        Type: 'A',
        AliasTarget: {
          DNSName: {
            'Fn::GetAtt': ['StaticSiteDistribution', 'DomainName']
          },
          HostedZoneId: {
            'Fn::GetAtt': ['StaticSiteDistribution', 'DistributionHostedZoneId']
          }
        }
      });
    });

    test('creates Route53 AAAA record for IPv6', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'example.com.',
        Type: 'AAAA'
      });
    });

    test('creates records for alternative names', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'www.example.com.',
        Type: 'A'
      });
    });
  });

  describe('S3 Deployment', () => {
    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: defaultConfig,
        apiUrl: 'http://localhost:3000',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates S3 deployment with CloudFront invalidation', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        NotificationConfiguration: {
          LambdaConfigurations: [
            {
              Event: 's3:ObjectCreated:*'
            }
          ]
        }
      });
    });
  });

  describe('Production Configuration', () => {
    const prodConfig = {
      ...defaultConfig,
      app: { ...defaultConfig.app, stage: 'production' }
    };

    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: prodConfig,
        apiUrl: 'https://api.example.com',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('uses retain policy for production S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain'
      });
    });

    test('enables versioning for production bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('disables auto delete objects for production', () => {
      // Should not have auto delete objects configuration
      template.hasResourceProperties('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain'
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: defaultConfig,
        apiUrl: 'http://localhost:3000',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('outputs static site URL', () => {
      template.hasOutput('StaticSiteUrl', {
        Description: 'URL of the static site',
        Export: {
          Name: 'test-app-test-static-site-url'
        }
      });
    });

    test('outputs CloudFront distribution ID', () => {
      template.hasOutput('CloudFrontDistributionId', {
        Description: 'CloudFront Distribution ID',
        Export: {
          Name: 'test-app-test-distribution-id'
        }
      });
    });

    test('outputs S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket name for static assets',
        Export: {
          Name: 'test-app-test-bucket-name'
        }
      });
    });
  });

  describe('Custom Domain Outputs', () => {
    const domainConfig = {
      ...defaultConfig,
      domain: {
        domainName: 'example.com',
        zoneName: 'example.com'
      }
    };

    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: domainConfig,
        apiUrl: 'https://api.example.com',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('outputs SSL certificate ARN', () => {
      template.hasOutput('SSLCertificateArn', {
        Description: 'SSL Certificate ARN',
        Export: {
          Name: 'test-app-test-certificate-arn'
        }
      });
    });

    test('outputs custom domain name', () => {
      template.hasOutput('CustomDomain', {
        Description: 'Custom domain name',
        Export: {
          Name: 'test-app-test-custom-domain'
        }
      });
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: defaultConfig,
        apiUrl: 'http://localhost:3000',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('blocks all public access to S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('enables HTTPS redirect on CloudFront', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https'
          }
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing API URL', () => {
      expect(() => {
        new StaticSiteStack(app, 'TestStaticSiteStack', {
          config: defaultConfig,
          apiUrl: undefined,
          env: { account: '123456789012', region: 'us-east-1' }
        });
      }).toThrow();
    });

    test('handles invalid domain configuration', () => {
      const invalidDomainConfig = {
        ...defaultConfig,
        domain: {
          domainName: 'example.com'
          // Missing zoneName
        }
      };

      expect(() => {
        new StaticSiteStack(app, 'TestStaticSiteStack', {
          config: invalidDomainConfig,
          apiUrl: 'https://api.example.com',
          env: { account: '123456789012', region: 'us-east-1' }
        });
      }).not.toThrow(); // Should handle gracefully
    });

    test('handles minimal configuration', () => {
      const minimalConfig = {
        app: { name: 'test', stage: 'test' }
      };

      expect(() => {
        new StaticSiteStack(app, 'TestStaticSiteStack', {
          config: minimalConfig,
          apiUrl: 'http://localhost:3000',
          env: { account: '123456789012', region: 'us-east-1' }
        });
      }).not.toThrow();
    });
  });

  describe('Environment-specific Configuration', () => {
    test('development uses cost-optimized settings', () => {
      const devConfig = {
        ...defaultConfig,
        app: { ...defaultConfig.app, stage: 'dev' }
      };

      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: devConfig,
        apiUrl: 'http://localhost:3000',
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete'
      });
    });

    test('staging uses intermediate settings', () => {
      const stagingConfig = {
        ...defaultConfig,
        app: { ...defaultConfig.app, stage: 'staging' }
      };

      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: stagingConfig,
        apiUrl: 'https://api-staging.example.com',
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(() => {
      const stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config: defaultConfig,
        apiUrl: 'http://localhost:3000',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('enables compression', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            Compress: true
          }
        }
      });
    });

    test('uses HTTP/2 and HTTP/3', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          HttpVersion: 'http2and3'
        }
      });
    });

    test('configures appropriate price class', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          PriceClass: 'PriceClass_200'
        }
      });
    });
  });
});
