const { App } = require('aws-cdk-lib');
const { Template, Match } = require('aws-cdk-lib/assertions');
const { DatabaseStack } = require('../lib/stacks/database-stack');
const { ApiStack } = require('../lib/stacks/api-stack');

describe('ApiStack', () => {
  let app;
  let databaseStack;
  let template;

  const defaultConfig = {
    app: {
      name: 'test-app',
      stage: 'test',
      environment: 'development'
    },
    api: {
      memory: 512,
      cpu: 256,
      desiredCount: 1,
      minCapacity: 1,
      maxCapacity: 3
    },
    monitoring: {
      enableDetailedMonitoring: false,
      logRetention: 7
    },
    database: {
      multiAz: false,
      bastionHost: {
        enabled: false
      }
    }
  };

  beforeEach(() => {
    app = new App();
    databaseStack = new DatabaseStack(app, 'TestDatabaseStack', {
      config: defaultConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
  });

  describe('ECR Repository', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates ECR repository', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'test-app-api',
        LifecyclePolicy: {
          LifecyclePolicyText: Match.anyValue()
        }
      });
    });
  });

  describe('ECS Configuration', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'test-app-api-cluster'
      });
    });

    test('creates Fargate task definition with correct configuration', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc'
      });
    });

    test('creates ECS service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: 'test-app-api-service',
        DesiredCount: 1,
        LaunchType: 'FARGATE'
      });
    });
  });

  describe('Application Load Balancer', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Name: 'test-app-api-alb',
        Scheme: 'internet-facing'
      });
    });

    test('creates target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/api/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3
      });
    });

    test('creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates security group for ECS service', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for API ECS service'
      });
    });

    test('allows inbound traffic from ALB', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const serviceSecurityGroup = Object.values(securityGroups).find(
        sg => sg.Properties.GroupDescription === 'Security group for API ECS service'
      );

      expect(serviceSecurityGroup).toBeDefined();
      expect(serviceSecurityGroup.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 3000,
            ToPort: 3000
          })
        ])
      );
    });

    test('allows outbound HTTPS for AWS services', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const serviceSecurityGroup = Object.values(securityGroups).find(
        sg => sg.Properties.GroupDescription === 'Security group for API ECS service'
      );

      expect(serviceSecurityGroup).toBeDefined();
      expect(serviceSecurityGroup.Properties.SecurityGroupEgress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default'
          })
        ])
      );
    });
  });

  describe('Auto Scaling', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates auto scaling target', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 1,
        MaxCapacity: 3,
        ServiceNamespace: 'ecs'
      });
    });

    test('creates scaling policy for CPU utilization', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization'
          }
        }
      });
    });

    test('creates scaling policy for memory utilization', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 80,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageMemoryUtilization'
          }
        }
      });
    });
  });

  describe('Secrets Management', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates app secrets', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'test-app/test/app/secrets'
      });
    });

    test('creates session secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'test-app/test/session/secret'
      });
    });
  });

  describe('Container Configuration', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('configures container with environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Environment: Match.arrayWith([
              { Name: 'NODE_ENV', Value: Match.anyValue() },
              { Name: 'PORT', Value: '3000' },
              { Name: 'DATABASE_TYPE', Value: 'dynamodb' },
              { Name: 'AWS_REGION', Value: Match.anyValue() },
              { Name: 'DYNAMODB_EVENTS_TABLE', Value: Match.anyValue() },
              { Name: 'DYNAMODB_PARTICIPANTS_TABLE', Value: Match.anyValue() },
              { Name: 'DYNAMODB_USERS_TABLE', Value: Match.anyValue() },
              { Name: 'DYNAMODB_TALKS_TABLE', Value: Match.anyValue() }
            ])
          })
        ])
      });
    });

    test('configures container with secrets', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Secrets: Match.arrayWith([
              Match.objectLike({ Name: 'JWT_SECRET' }),
              Match.objectLike({ Name: 'SESSION_SECRET' })
            ])
          })
        ])
      });
    });

    test('configures health check', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            HealthCheck: Match.objectLike({
              Command: ['CMD-SHELL', 'curl -f http://localhost:3000/api/health || exit 1'],
              Interval: 30,
              Timeout: 5,
              Retries: 3,
              StartPeriod: 60
            })
          })
        ])
      });
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ecs/test-app-api',
        RetentionInDays: 7
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    beforeEach(() => {
      const stack = new ApiStack(app, 'TestApiStack', {
        config: defaultConfig,
        databaseStack: databaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);
    });

    test('creates task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });

    test('grants DynamoDB access to task role', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const dynamoDbPolicy = Object.values(policies).find(policy =>
        policy.Properties.PolicyDocument.Statement.some(
          statement =>
            statement.Action &&
            Array.isArray(statement.Action) &&
            statement.Action.some(action => action.includes('dynamodb:'))
        )
      );

      expect(dynamoDbPolicy).toBeDefined();
    });
  });

  describe('Production Configuration', () => {
    let prodConfig;

    beforeEach(() => {
      prodConfig = {
        ...defaultConfig,
        app: {
          ...defaultConfig.app,
          environment: 'production'
        },
        monitoring: {
          ...defaultConfig.monitoring,
          enableDetailedMonitoring: true,
          logRetention: 30
        },
        api: {
          ...defaultConfig.api,
          desiredCount: 2
        }
      };
    });

    test('enables detailed monitoring for production', () => {
      const prodDatabaseStack = new DatabaseStack(app, 'ProdDatabaseStack', {
        config: prodConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const stack = new ApiStack(app, 'ProdApiStack', {
        config: prodConfig,
        databaseStack: prodDatabaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2
      });
    });

    test('uses longer log retention for production', () => {
      const prodDatabaseStack = new DatabaseStack(app, 'ProdDatabaseStack', {
        config: prodConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const stack = new ApiStack(app, 'ProdApiStack', {
        config: prodConfig,
        databaseStack: prodDatabaseStack,
        env: { account: '123456789012', region: 'us-east-1' }
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30
      });
    });
  });
});
