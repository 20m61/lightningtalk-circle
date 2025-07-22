/**
 * Lightning Talk Circle - Base Infrastructure Stack
 * 全環境で共通利用される基盤インフラストラクチャを管理
 */

const { Stack, Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const { HostedZone } = require('aws-cdk-lib/aws-route53');
const { Certificate, CertificateValidation } = require('aws-cdk-lib/aws-certificatemanager');

class BaseInfrastructureStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, environment } = props;

    // Route53 Hosted Zone（既存のものを参照）
    this.hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.domainName,
    });

    // ACM Certificate（us-east-1リージョンで作成）
    if (this.region === 'us-east-1') {
      this.certificate = new Certificate(this, 'UniversalCertificate', {
        domainName: config.domainName,
        subjectAlternativeNames: [
          `*.${config.domainName}`,
          `www.${config.domainName}`,
          `api.${config.domainName}`,
          `admin.${config.domainName}`,
          `storybook.${config.domainName}`,
          `storybook-staging.${config.domainName}`,
          `ws.${config.domainName}`,
          // 環境別サブドメイン
          ...(environment === 'dev' ? [
            `dev.${config.domainName}`,
            `*.dev.${config.domainName}`,
          ] : []),
          ...(environment === 'staging' ? [
            `staging.${config.domainName}`,
            `*.staging.${config.domainName}`,
          ] : []),
        ],
        validation: CertificateValidation.fromDns(this.hostedZone),
      });

      // Export certificate ARN for cross-region reference
      new CfnOutput(this, 'CertificateArn', {
        value: this.certificate.certificateArn,
        exportName: `${this.stackName}-CertificateArn`,
        description: 'ACM Certificate ARN for CloudFront',
      });
    }

    // 共通タグ
    const commonTags = {
      Project: config.projectName || 'Lightning Talk Circle',
      Environment: environment,
      ManagedBy: 'CDK',
      Repository: 'https://github.com/20m61/lightningtalk-circle',
      CostCenter: environment === 'prod' ? 'Production' : 'Development',
    };

    // すべてのリソースにタグを適用
    Object.entries(commonTags).forEach(([key, value]) => {
      this.tags.setTag(key, value);
    });

    // Stack Outputs
    new CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      exportName: `${this.stackName}-HostedZoneId`,
      description: 'Route53 Hosted Zone ID',
    });

    new CfnOutput(this, 'DomainName', {
      value: config.domainName,
      exportName: `${this.stackName}-DomainName`,
      description: 'Primary domain name',
    });

    new CfnOutput(this, 'Environment', {
      value: environment,
      exportName: `${this.stackName}-Environment`,
      description: 'Deployment environment',
    });
  }
}

module.exports = { BaseInfrastructureStack };