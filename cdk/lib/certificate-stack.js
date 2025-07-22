/**
 * Lightning Talk Circle - Certificate Management Stack
 * Manages ACM certificates for all domains and subdomains
 */

const { Stack, CfnOutput } = require('aws-cdk-lib');
const { Certificate, CertificateValidation } = require('aws-cdk-lib/aws-certificatemanager');
const { HostedZone } = require('aws-cdk-lib/aws-route53');

class CertificateStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { domainName, hostedZoneId, environment = 'prod' } = props;

    // Import the hosted zone
    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: hostedZoneId,
      zoneName: domainName,
    });

    // Define all domains to include in the certificate
    const domainNames = [
      domainName,                                    // xn--6wym69a.com
      `www.${domainName}`,                          // www.xn--6wym69a.com
      `storybook.${domainName}`,                    // storybook.xn--6wym69a.com
      `storybook-staging.${domainName}`,            // storybook-staging.xn--6wym69a.com
      `dev.${domainName}`,                          // dev.xn--6wym69a.com
      `storybook.dev.${domainName}`,                // storybook.dev.xn--6wym69a.com
      `api.${domainName}`,                          // api.xn--6wym69a.com (for future API subdomain)
      `staging.${domainName}`,                      // staging.xn--6wym69a.com (for staging environment)
    ];

    // Create the certificate with all domains
    this.certificate = new Certificate(this, 'Certificate', {
      domainName: domainName,                       // Primary domain
      subjectAlternativeNames: domainNames,        // All domains including primary
      validation: CertificateValidation.fromDns(hostedZone),
      region: 'us-east-1', // CloudFront requires certificates in us-east-1
    });

    // Output the certificate ARN
    new CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ARN of the ACM certificate for all Lightning Talk domains',
      exportName: `${this.stackName}-CertificateArn`,
    });

    // Output all included domains for reference
    new CfnOutput(this, 'IncludedDomains', {
      value: domainNames.join(', '),
      description: 'All domains included in the certificate',
    });

    // Tags
    this.tags.setTag('Project', 'Lightning Talk Circle');
    this.tags.setTag('Component', 'Certificate');
    this.tags.setTag('Environment', environment);
    this.tags.setTag('ManagedBy', 'CDK');
  }
}

module.exports = { CertificateStack };