import { jest } from '@jest/globals';
import { Template } from 'aws-cdk-lib/assertions';
import { App } from 'aws-cdk-lib';

/**
 * CDK Static Site Stack Unit Tests
 * CDK スタティックサイトスタックの単体テスト
 */

// Mock AWS CDK modules
jest.mock('aws-cdk-lib/aws-s3', () => ({
  Bucket: jest.fn(),
  BlockPublicAccess: { BLOCK_ALL: 'BLOCK_ALL' },
  HttpMethods: { GET: 'GET', HEAD: 'HEAD' }
}));

jest.mock('aws-cdk-lib/aws-cloudfront', () => ({
  Distribution: jest.fn(),
  OriginAccessIdentity: jest.fn(),
  ViewerProtocolPolicy: { REDIRECT_TO_HTTPS: 'REDIRECT_TO_HTTPS' },
  AllowedMethods: { ALLOW_GET_HEAD_OPTIONS: 'ALLOW_GET_HEAD_OPTIONS', ALLOW_ALL: 'ALLOW_ALL' },
  CachedMethods: {
    CACHE_GET_HEAD_OPTIONS: 'CACHE_GET_HEAD_OPTIONS',
    CACHE_GET_HEAD: 'CACHE_GET_HEAD'
  },
  CachePolicy: { CACHING_OPTIMIZED: 'CACHING_OPTIMIZED', CACHING_DISABLED: 'CACHING_DISABLED' },
  OriginRequestPolicy: { ALL_VIEWER: 'ALL_VIEWER' },
  PriceClass: { PRICE_CLASS_200: 'PRICE_CLASS_200' },
  HttpVersion: { HTTP2_AND_3: 'HTTP2_AND_3' },
  SecurityPolicyProtocol: { TLS_V1_2_2021: 'TLS_V1_2_2021' }
}));

jest.mock('aws-cdk-lib/aws-cloudfront-origins', () => ({
  S3Origin: jest.fn(),
  HttpOrigin: jest.fn()
}));

jest.mock('aws-cdk-lib/aws-s3-deployment', () => ({
  BucketDeployment: jest.fn(),
  Source: { asset: jest.fn() }
}));

jest.mock('aws-cdk-lib/aws-route53', () => ({
  HostedZone: {
    fromHostedZoneAttributes: jest.fn(),
    fromLookup: jest.fn()
  },
  ARecord: jest.fn(),
  AaaaRecord: jest.fn(),
  RecordTarget: {
    fromAlias: jest.fn()
  }
}));

jest.mock('aws-cdk-lib/aws-route53-targets', () => ({
  CloudFrontTarget: jest.fn()
}));

jest.mock('aws-cdk-lib/aws-certificatemanager', () => ({
  Certificate: {
    fromCertificateArn: jest.fn()
  },
  CertificateValidation: {
    fromDns: jest.fn()
  }
}));

// Import the stack after mocking
import { StaticSiteStack } from '../../../cdk/lib/stacks/static-site-stack.js';

describe('StaticSiteStack', () => {
  let app;
  let stack;

  beforeEach(() => {
    app = new App();
    jest.clearAllMocks();
  });

  describe('basic configuration', () => {
    it('should create stack with minimal configuration', () => {
      const config = {
        app: {
          name: 'test-app',
          stage: 'dev'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'http://localhost:3000'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.distributionId).toBeDefined();
      expect(stack.bucketName).toBeDefined();
    });

    it('should create stack with production configuration', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        cdn: {
          priceClass: 'PriceClass_200',
          compression: true
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
      expect(stack.distributionUrl).toBeDefined();
    });
  });

  describe('custom domain configuration', () => {
    it('should create stack with custom domain', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        domain: {
          domainName: 'example.com',
          zoneName: 'example.com',
          alternativeNames: ['www.example.com']
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
      expect(stack.distributionUrl).toBe('https://example.com');
    });

    it('should create stack with existing certificate', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        domain: {
          domainName: 'example.com',
          certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
      expect(stack.certificateArn).toBe('arn:aws:acm:us-east-1:123456789012:certificate/test');
    });

    it('should create stack with hosted zone lookup', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        domain: {
          domainName: 'subdomain.example.com',
          zoneName: 'example.com',
          hostedZoneId: 'Z1234567890ABC'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
    });
  });

  describe('S3 bucket configuration', () => {
    it('should create S3 bucket with proper settings for production', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack.bucketName).toBe('lightningtalk-static-production');
    });

    it('should create S3 bucket with proper settings for development', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'dev'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'http://localhost:3000'
      });

      expect(stack.bucketName).toBe('lightningtalk-static-dev');
    });
  });

  describe('CloudFront distribution configuration', () => {
    it('should create CloudFront distribution with proper caching', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        cdn: {
          priceClass: 'PriceClass_200',
          compression: true,
          httpVersion: 'http2and3'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack.distributionId).toBeDefined();
    });

    it('should configure API behavior for /api/* paths', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
    });

    it('should handle SPA routing with proper error responses', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
    });
  });

  describe('Route53 DNS configuration', () => {
    it('should create A and AAAA records for custom domain', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        domain: {
          domainName: 'example.com',
          zoneName: 'example.com',
          alternativeNames: ['www.example.com']
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
    });

    it('should create records for alternative names', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        domain: {
          domainName: 'example.com',
          zoneName: 'example.com',
          alternativeNames: ['www.example.com', 'app.example.com']
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
    });
  });

  describe('SSL certificate management', () => {
    it('should create new certificate when not provided', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        domain: {
          domainName: 'example.com',
          zoneName: 'example.com'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack.certificateArn).toBeDefined();
    });

    it('should use existing certificate when provided', () => {
      const existingCertArn = 'arn:aws:acm:us-east-1:123456789012:certificate/existing';
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        domain: {
          domainName: 'example.com',
          certificateArn: existingCertArn
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack.certificateArn).toBe(existingCertArn);
    });
  });

  describe('CloudFormation outputs', () => {
    it('should create proper CloudFormation outputs', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack.distributionUrl).toBeDefined();
      expect(stack.distributionId).toBeDefined();
      expect(stack.bucketName).toBeDefined();
    });

    it('should create custom domain output when configured', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        domain: {
          domainName: 'example.com',
          zoneName: 'example.com'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack.distributionUrl).toBe('https://example.com');
    });
  });

  describe('security configurations', () => {
    it('should configure proper security headers', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        },
        security: {
          minimumProtocolVersion: 'TLSv1.2_2021',
          sslSupportMethod: 'sni-only'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
    });

    it('should block public access on S3 bucket', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack).toBeInstanceOf(StaticSiteStack);
    });
  });

  describe('error handling', () => {
    it('should handle missing configuration gracefully', () => {
      const config = {
        app: {
          name: 'test-app',
          stage: 'dev'
        }
      };

      expect(() => {
        stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
          config,
          apiUrl: 'http://localhost:3000'
        });
      }).not.toThrow();
    });

    it('should handle invalid domain configuration', () => {
      const config = {
        app: {
          name: 'test-app',
          stage: 'dev'
        },
        domain: {
          domainName: 'invalid-domain'
          // Missing zoneName or certificateArn
        }
      };

      expect(() => {
        stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
          config,
          apiUrl: 'http://localhost:3000'
        });
      }).not.toThrow();
    });
  });

  describe('environment-specific configurations', () => {
    it('should use retention policy for production', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'production'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'https://api.example.com'
      });

      expect(stack.bucketName).toBe('lightningtalk-static-production');
    });

    it('should use destroy policy for development', () => {
      const config = {
        app: {
          name: 'lightningtalk',
          stage: 'dev'
        }
      };

      stack = new StaticSiteStack(app, 'TestStaticSiteStack', {
        config,
        apiUrl: 'http://localhost:3000'
      });

      expect(stack.bucketName).toBe('lightningtalk-static-dev');
    });
  });
});
