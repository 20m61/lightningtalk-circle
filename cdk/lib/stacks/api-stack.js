const { Stack, Duration } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const ecs = require('aws-cdk-lib/aws-ecs');
const ecr = require('aws-cdk-lib/aws-ecr');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const logs = require('aws-cdk-lib/aws-logs');
const iam = require('aws-cdk-lib/aws-iam');
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager');

class ApiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, vpc, database, redis } = props;

    // Create ECR repository
    const repository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: `${config.app.name}-api`,
      lifecycleRules: [{
        maxImageCount: 10,
        rulePriority: 1,
        description: 'Keep only 10 images',
      }],
    });

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, 'ApiCluster', {
      vpc,
      clusterName: `${config.app.name}-api-cluster`,
      containerInsights: config.monitoring.enableDetailedMonitoring,
    });

    // Create log group
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/ecs/${config.app.name}-api`,
      retention: logs.RetentionDays[`DAYS_${config.monitoring.logRetention}`],
    });

    // Create task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      memoryLimitMiB: config.api.memory,
      cpu: config.api.cpu,
      taskRole: new iam.Role(this, 'ApiTaskRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
        ],
      }),
    });

    // Create application secrets
    const appSecrets = new secretsmanager.Secret(this, 'AppSecrets', {
      secretName: `${config.app.name}/${config.app.stage}/app/secrets`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'jwt_secret',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/\\@"',
        passwordLength: 64,
      },
    });

    // Add session secret to the app secrets
    appSecrets.addToGeneratedSecretKey(
      'session_secret',
      { excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/\\@"', passwordLength: 64 }
    );

    // Add container to task definition
    const container = taskDefinition.addContainer('api', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup,
      }),
      environment: {
        NODE_ENV: config.app.stage,
        PORT: '3000',
        DATABASE_TYPE: 'postgresql',
        REDIS_HOST: redis.attrRedisEndpointAddress,
        REDIS_PORT: redis.attrRedisEndpointPort,
        DB_HOST: database.dbInstanceEndpointAddress,
        DB_PORT: database.dbInstanceEndpointPort,
        DB_NAME: 'lightningtalk',
      },
      secrets: {
        DB_USER: ecs.Secret.fromSecretsManager(database.secret, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(database.secret, 'password'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(appSecrets, 'jwt_secret'),
        SESSION_SECRET: ecs.Secret.fromSecretsManager(appSecrets, 'session_secret'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/api/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Create ALB
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ApiALB', {
      vpc,
      internetFacing: true,
      loadBalancerName: `${config.app.name}-api-alb`,
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/api/health',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Add listener
    const listener = this.alb.addListener('ApiListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create security group for ECS service
    const serviceSecurityGroup = new ec2.SecurityGroup(this, 'ApiServiceSecurityGroup', {
      vpc,
      description: 'Security group for API ECS service',
    });

    serviceSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.alb.connections.securityGroups[0].securityGroupId),
      ec2.Port.tcp(3000),
      'Allow traffic from ALB'
    );

    // Create ECS service
    this.service = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition,
      desiredCount: config.api.desiredCount,
      assignPublicIp: false,
      securityGroups: [serviceSecurityGroup],
      serviceName: `${config.app.name}-api-service`,
    });

    this.service.attachToApplicationTargetGroup(targetGroup);

    // Auto-scaling
    if (config.api.minCapacity !== config.api.maxCapacity) {
      const scaling = this.service.autoScaleTaskCount({
        minCapacity: config.api.minCapacity,
        maxCapacity: config.api.maxCapacity,
      });

      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: Duration.seconds(60),
        scaleOutCooldown: Duration.seconds(60),
      });

      scaling.scaleOnMemoryUtilization('MemoryScaling', {
        targetUtilizationPercent: 80,
        scaleInCooldown: Duration.seconds(60),
        scaleOutCooldown: Duration.seconds(60),
      });
    }

    // Store security group for use by database stack
    this.serviceSecurityGroup = serviceSecurityGroup;

    // Output the API URL
    this.apiUrl = `http://${this.alb.loadBalancerDnsName}`;
  }
}

module.exports = { ApiStack };