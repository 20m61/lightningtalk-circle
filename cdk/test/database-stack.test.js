const { Template } = require('aws-cdk-lib/assertions');
const cdk = require('aws-cdk-lib');
const { DatabaseStack } = require('../lib/stacks/database-stack');

describe('DatabaseStack', () => {
  let app;
  let stack;
  let template;
  let config;

  beforeEach(() => {
    app = new cdk.App();
    config = {
      app: {
        name: 'test-app',
        stage: 'test',
        environment: 'development'
      },
      database: {
        multiAz: false,
        bastionHost: {
          enabled: false
        }
      }
    };
    stack = new DatabaseStack(app, 'TestDatabaseStack', { config });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('creates public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('creates NAT gateway for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('DynamoDB Tables', () => {
    test('creates Events table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-app-test-events',
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        },
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ]
      });
    });

    test('creates Participants table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-app-test-participants',
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'eventId', KeyType: 'RANGE' }
        ]
      });
    });

    test('creates Users table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-app-test-users',
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }]
      });
    });

    test('creates Talks table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-app-test-talks',
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'eventId', KeyType: 'RANGE' }
        ]
      });
    });

    test('all tables have encryption enabled', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach(table => {
        expect(table.Properties.SSESpecification).toEqual({
          SSEEnabled: true
        });
      });
    });

    test('events table has date-index GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-app-test-events',
        GlobalSecondaryIndexes: [
          {
            IndexName: 'date-index',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'date', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ]
      });
    });

    test('participants table has event-index GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-app-test-participants',
        GlobalSecondaryIndexes: [
          {
            IndexName: 'event-index',
            KeySchema: [
              { AttributeName: 'eventId', KeyType: 'HASH' },
              { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ]
      });
    });

    test('users table has email-index GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-app-test-users',
        GlobalSecondaryIndexes: [
          {
            IndexName: 'email-index',
            KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' }
          }
        ]
      });
    });
  });

  describe('Bastion Host', () => {
    test('does not create bastion host when disabled', () => {
      template.resourceCountIs('AWS::EC2::BastionHostLinux', 0);
    });

    test('creates bastion host when enabled', () => {
      const bastionApp = new cdk.App();
      const configWithBastion = {
        ...config,
        database: {
          ...config.database,
          bastionHost: {
            enabled: true,
            allowedIps: ['10.0.0.0/8']
          }
        }
      };
      const stackWithBastion = new DatabaseStack(bastionApp, 'TestDatabaseStackWithBastion', {
        config: configWithBastion
      });
      const templateWithBastion = Template.fromStack(stackWithBastion);

      // Check that bastion host instance was created
      templateWithBastion.resourceCountIs('AWS::EC2::Instance', 1);
      templateWithBastion.hasResourceProperties('AWS::EC2::Instance', {
        Tags: [
          {
            Key: 'Name',
            Value: 'test-app-bastion'
          }
        ]
      });
    });
  });

  describe('Secrets', () => {
    test('creates API credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'test-app/test/api/credentials'
      });
    });
  });

  describe('Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID'
      });
    });

    test('exports all table names', () => {
      template.hasOutput('EventsTableName', {
        Description: 'DynamoDB Events table name'
      });
      template.hasOutput('ParticipantsTableName', {
        Description: 'DynamoDB Participants table name'
      });
      template.hasOutput('UsersTableName', {
        Description: 'DynamoDB Users table name'
      });
      template.hasOutput('TalksTableName', {
        Description: 'DynamoDB Talks table name'
      });
    });

    test('exports API credentials secret ARN', () => {
      template.hasOutput('ApiCredentialsSecretArn', {
        Description: 'API credentials secret ARN'
      });
    });
  });

  describe('Production Configuration', () => {
    test('enables point-in-time recovery for production', () => {
      const prodApp = new cdk.App();
      const prodConfig = {
        ...config,
        app: {
          ...config.app,
          environment: 'production'
        }
      };
      const prodStack = new DatabaseStack(prodApp, 'TestDatabaseStackProd', { config: prodConfig });
      const prodTemplate = Template.fromStack(prodStack);

      const tables = prodTemplate.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach(table => {
        expect(table.Properties.PointInTimeRecoverySpecification).toEqual({
          PointInTimeRecoveryEnabled: true
        });
      });
    });

    test('sets retention policy to RETAIN for production', () => {
      const prodApp2 = new cdk.App();
      const prodConfig = {
        ...config,
        app: {
          ...config.app,
          environment: 'production'
        }
      };
      const prodStack = new DatabaseStack(prodApp2, 'TestDatabaseStackProd2', {
        config: prodConfig
      });
      const prodTemplate = Template.fromStack(prodStack);

      const tables = prodTemplate.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach(table => {
        expect(table.DeletionPolicy).toBe('Retain');
      });
    });
  });
});
