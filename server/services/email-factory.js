/**
 * Email Service Factory - Strategy Pattern for Email Service Selection
 * Allows seamless switching between development and production email services
 */

import { EmailService } from './email.js';
import { ProductionEmailService } from './email-production.js';

export class EmailServiceFactory {
  static create(options = {}) {
    const emailProvider = options.provider || process.env.EMAIL_PROVIDER || 'simulation';
    const environment = options.environment || process.env.NODE_ENV || 'development';

    // Force production service for specific providers
    if (['sendgrid', 'ses'].includes(emailProvider)) {
      console.log(`📧 Using Production Email Service (${emailProvider})`);
      return new ProductionEmailService();
    }

    // Use production service in production environment
    if (environment === 'production' && process.env.EMAIL_ENABLED === 'true') {
      console.log('📧 Using Production Email Service (production mode)');
      return new ProductionEmailService();
    }

    // Default to simulation service for development
    console.log('📧 Using Simulation Email Service (development mode)');
    return new EmailService();
  }

  static async createAndInitialize(options = {}) {
    const emailService = this.create(options);

    // Wait for service to be ready if it has async initialization
    if (emailService.setupQueue && typeof emailService.setupQueue === 'function') {
      await new Promise(resolve => {
        if (emailService.initialized) {
          resolve();
        } else {
          emailService.once('ready', resolve);
        }
      });
    }

    return emailService;
  }

  static getSupportedProviders() {
    return [
      {
        provider: 'simulation',
        name: 'Simulation Service',
        description: 'Console logging for development',
        recommended: 'development',
        features: ['template-testing', 'console-output']
      },
      {
        provider: 'sendgrid',
        name: 'SendGrid',
        description: 'Cloud email delivery platform',
        recommended: 'production',
        features: ['high-deliverability', 'analytics', 'templates', 'queue-support'],
        requirements: ['SENDGRID_API_KEY']
      },
      {
        provider: 'ses',
        name: 'Amazon SES',
        description: 'AWS Simple Email Service',
        recommended: 'production',
        features: ['cost-effective', 'aws-integration', 'high-volume'],
        requirements: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION']
      }
    ];
  }

  static validateConfiguration(provider = null) {
    const emailProvider = provider || process.env.EMAIL_PROVIDER || 'simulation';
    const validation = {
      provider: emailProvider,
      valid: true,
      errors: [],
      warnings: []
    };

    switch (emailProvider) {
      case 'sendgrid':
        // Check SendGrid configuration
        if (!process.env.SENDGRID_API_KEY) {
          validation.errors.push('SENDGRID_API_KEY is required for SendGrid provider');
          validation.valid = false;
        }

        if (!process.env.EMAIL_FROM) {
          validation.warnings.push('EMAIL_FROM should be set for better deliverability');
        }

        // Validate API key format
        if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
          validation.warnings.push('SendGrid API key should start with "SG."');
        }
        break;

      case 'ses': {
        // Check AWS SES configuration
        const requiredAwsVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
        const missingVars = requiredAwsVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
          validation.errors.push(`Missing AWS credentials: ${missingVars.join(', ')}`);
          validation.valid = false;
        }

        if (!process.env.AWS_REGION) {
          validation.warnings.push('AWS_REGION not set, defaulting to us-east-1');
        }
        break;
      }

      case 'simulation':
        // Simulation mode warnings
        if (process.env.NODE_ENV === 'production') {
          validation.warnings.push('Using simulation mode in production environment');
        }
        break;

      default:
        validation.errors.push(`Unsupported email provider: ${emailProvider}`);
        validation.valid = false;
    }

    // Check Redis configuration for queue support
    if (['sendgrid', 'ses'].includes(emailProvider)) {
      if (!process.env.REDIS_URL) {
        validation.warnings.push(
          'REDIS_URL not set, email queue will use default Redis connection'
        );
      }
    }

    // Check general email configuration
    if (process.env.EMAIL_ENABLED === 'true' && !process.env.EMAIL_FROM) {
      validation.warnings.push('EMAIL_FROM should be set when email is enabled');
    }

    return validation;
  }

  static async testEmailConfiguration(provider = null) {
    try {
      const emailService = this.create({ provider });

      // Perform health check if available
      if (emailService.healthCheck && typeof emailService.healthCheck === 'function') {
        return await emailService.healthCheck();
      }

      return {
        status: 'healthy',
        provider: provider || process.env.EMAIL_PROVIDER || 'simulation',
        message: 'Email service created successfully'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: provider || process.env.EMAIL_PROVIDER || 'simulation',
        error: error.message
      };
    }
  }
}

export default EmailServiceFactory;
