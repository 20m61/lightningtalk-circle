/**
 * Production Environment Stack
 * High-availability, scalable stack for production workloads
 */

const { Stack, Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const { 
  Cluster, 
  FargateService, 
  TaskDefinition, 
  ContainerImage, 
  Compatibility,
  LogDriver,
  Protocol
} = require('aws-cdk-lib/aws-ecs');
const { Repository } = require('aws-cdk-lib/aws-ecr');
const { 
  ApplicationLoadBalancer, 
  ApplicationTargetGroup, 
  TargetType, 
  ApplicationProtocol,
  ListenerAction
} = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const { Vpc, SecurityGroup, Port, Peer } = require('aws-cdk-lib/aws-ec2');
const { Table, BillingMode, AttributeType, GlobalSecondaryIndex } = require('aws-cdk-lib/aws-dynamodb');
const { Bucket, BucketEncryption, BlockPublicAccess } = require('aws-cdk-lib/aws-s3');
const { Distribution, OriginAccessIdentity, CachePolicy } = require('aws-cdk-lib/aws-cloudfront');
const { S3BucketOrigin, LoadBalancerV2Origin } = require('aws-cdk-lib/aws-cloudfront-origins');
const { Secret } = require('aws-cdk-lib/aws-secretsmanager');
const { LogGroup, RetentionDays } = require('aws-cdk-lib/aws-logs');
const { 
  Alarm, 
  Metric, 
  ComparisonOperator, 
  Dashboard, 
  GraphWidget, 
  Statistic,
  TreatMissingData
} = require('aws-cdk-lib/aws-cloudwatch');
const { Topic } = require('aws-cdk-lib/aws-sns');
const { EmailSubscription } = require('aws-cdk-lib/aws-sns-subscriptions');
const { 
  CfnWebACL
} = require('aws-cdk-lib/aws-wafv2');
const { Role, ServicePrincipal, PolicyStatement, ManagedPolicy } = require('aws-cdk-lib/aws-iam');
const { Certificate } = require('aws-cdk-lib/aws-certificatemanager');
const { Budget, BudgetProps } = require('aws-cdk-lib/aws-budgets');

class ProdEnvironmentStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { 
      environment = 'prod',
      domainConfig = {},
      enableMonitoring = true,
      enableWaf = true,
      enableCostMonitoring = true,
      alertEmail = 'admin@lightningtalk.com'
    } = props;

    // =================================
    // VPC and Networking
    // =================================
    
    const vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1, // Cost optimization - single NAT gateway
    });

    const albSecurityGroup = new SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS traffic'
    );

    const ecsSecurityGroup = new SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS services',
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      Port.tcp(3000),
      'Allow traffic from ALB'
    );

    // =================================
    // DynamoDB Tables (Production)
    // =================================
    
    const eventsTable = new Table(this, 'EventsTable', {
      tableName: `lightningtalk-${environment}-events`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN, // Preserve data in production
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // Add GSI for querying by date
    eventsTable.addGlobalSecondaryIndex({
      indexName: 'date-index',
      partitionKey: { name: 'date', type: AttributeType.STRING },
      sortKey: { name: 'createdAt', type: AttributeType.STRING },
    });

    const participantsTable = new Table(this, 'ParticipantsTable', {
      tableName: `lightningtalk-${environment}-participants`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // Add GSI for querying by event
    participantsTable.addGlobalSecondaryIndex({
      indexName: 'event-index',
      partitionKey: { name: 'eventId', type: AttributeType.STRING },
      sortKey: { name: 'createdAt', type: AttributeType.STRING },
    });

    const usersTable = new Table(this, 'UsersTable', {
      tableName: `lightningtalk-${environment}-users`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // Add GSI for querying by email
    usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: AttributeType.STRING },
    });

    const talksTable = new Table(this, 'TalksTable', {
      tableName: `lightningtalk-${environment}-talks`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
    });

    // =================================
    // Secrets Management (Enhanced)
    // =================================
    
    const appSecrets = new Secret(this, 'AppSecrets', {
      secretName: `lightningtalk-${environment}-secrets`,
      description: 'Application secrets for production environment',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: '',
          SESSION_SECRET: '',
          EMAIL_SERVICE_KEY: '',
          GOOGLE_CLIENT_SECRET: '',
          DATABASE_PASSWORD: '',
          ENCRYPTION_KEY: ''
        }),
        generateStringKey: 'GENERATED_SECRET',
        excludeCharacters: '"@/\\',
        passwordLength: 64, // Longer passwords for production
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // =================================
    // ECR Repository for Container Images
    // =================================
    
    const repository = new Repository(this, 'AppRepository', {
      repositoryName: `lightningtalk-${environment}`,
      imageScanOnPush: true,
      lifecycleRules: [{
        description: 'Keep last 10 images',
        maxImageCount: 10,
      }],
      removalPolicy: RemovalPolicy.RETAIN, // Keep images in production
    });

    // =================================
    // ECS Cluster and Service
    // =================================
    
    const cluster = new Cluster(this, 'Cluster', {
      clusterName: `lightningtalk-${environment}`,
      vpc,
      containerInsights: true,
    });

    const taskDefinition = new TaskDefinition(this, 'TaskDefinition', {
      family: `lightningtalk-${environment}`,
      compatibility: Compatibility.FARGATE,
      cpu: '512',
      memoryMiB: '1024',
    });

    const taskRole = new Role(this, 'TaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant DynamoDB permissions
    [eventsTable, participantsTable, usersTable, talksTable].forEach(table => {
      table.grantReadWriteData(taskRole);
    });

    // Grant Secrets Manager permissions
    appSecrets.grantRead(taskRole);

    // Grant CloudWatch permissions
    taskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
    );

    const logGroup = new LogGroup(this, 'AppLogGroup', {
      logGroupName: `/aws/ecs/${environment}/app`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const container = taskDefinition.addContainer('app', {
      image: ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: LogDriver.awsLogs({
        logGroup,
        streamPrefix: 'app',
      }),
      environment: {
        NODE_ENV: environment,
        // AWS_REGION is automatically available in ECS runtime
        DYNAMODB_EVENTS_TABLE: eventsTable.tableName,
        DYNAMODB_PARTICIPANTS_TABLE: participantsTable.tableName,
        DYNAMODB_USERS_TABLE: usersTable.tableName,
        DYNAMODB_TALKS_TABLE: talksTable.tableName,
        SECRETS_ARN: appSecrets.secretArn,
      },
      taskRole,
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: Protocol.TCP,
    });

    // =================================
    // Application Load Balancer
    // =================================
    
    const alb = new ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `lightningtalk-${environment}`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    const targetGroup = new ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `lightningtalk-${environment}`,
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
      vpc,
      targetType: TargetType.IP,
      healthCheck: {
        path: '/api/health',
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        port: '3000',
        protocol: ApplicationProtocol.HTTP,
      },
    });

    const listener = alb.addListener('Listener', {
      port: 80,
      defaultAction: ListenerAction.forward([targetGroup]),
    });

    const service = new FargateService(this, 'Service', {
      serviceName: `lightningtalk-${environment}`,
      cluster,
      taskDefinition,
      desiredCount: 2, // High availability
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false, // Use private subnets
    });

    service.attachToApplicationTargetGroup(targetGroup);

    // =================================
    // Auto Scaling Configuration
    // =================================
    
    const scaling = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    // Scale based on CPU utilization
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // Scale based on memory utilization
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // Scale based on ALB request count
    scaling.scaleOnRequestCount('RequestCountScaling', {
      requestsPerTarget: 1000,
      targetGroup: targetGroup,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // =================================
    // Static Site (S3 + CloudFront)
    // =================================
    
    const staticBucket = new Bucket(this, 'StaticBucket', {
      bucketName: `lightningtalk-${environment}-static-${this.account}`,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
    });

    const originAccessIdentity = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${environment} static site`,
    });

    staticBucket.grantRead(originAccessIdentity);

    // =================================
    // Web Application Firewall (WAF)
    // =================================
    
    let webAcl;
    if (enableWaf) {
      webAcl = new CfnWebACL(this, 'WebACL', {
        scope: 'CLOUDFRONT',
        name: `lightningtalk-${environment}-waf`,
        description: 'WAF for Lightning Talk Circle',
        defaultAction: { allow: {} },
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        rules: [
          {
            name: 'RateLimitRule',
            priority: 1,
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 2,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 3,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'KnownBadInputsRuleSetMetric',
            },
          },
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 4,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'SQLiRuleSetMetric',
            },
          },
        ],
      });
    }

    // =================================
    // CloudFront Distribution
    // =================================
    
    // Import existing SSL certificate
    const certificate = Certificate.fromCertificateArn(this, 'Certificate', 
      'arn:aws:acm:us-east-1:822063948773:certificate/42ab57fd-bb00-47c8-b218-fc23216e0f63'
    );

    const distribution = new Distribution(this, 'Distribution', {
      comment: `Lightning Talk Circle ${environment} distribution`,
      domainNames: ['xn--6wym69a.com', 'www.xn--6wym69a.com'],
      certificate: certificate,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(staticBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: 'redirect-to-https',
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new LoadBalancerV2Origin(alb, {
            protocolPolicy: 'http-only',
          }),
          viewerProtocolPolicy: 'redirect-to-https',
          cachePolicy: CachePolicy.CACHING_DISABLED,
          allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      webAclId: webAcl?.attrArn,
    });

    // =================================
    // Enhanced Monitoring & Alerts
    // =================================
    
    if (enableMonitoring) {
      const alertTopic = new Topic(this, 'AlertTopic', {
        topicName: `lightningtalk-${environment}-alerts`,
      });

      alertTopic.addSubscription(new EmailSubscription(alertEmail));

      // ECS Service Alarms
      const serviceRunningTasksAlarm = new Alarm(this, 'ServiceRunningTasksAlarm', {
        alarmName: `${environment}-ecs-running-tasks`,
        metric: service.metricRunningTaskCount({
          statistic: Statistic.AVERAGE,
          period: Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.BREACHING,
      });

      serviceRunningTasksAlarm.addAlarmAction({
        bind: () => ({ alarmActionArn: alertTopic.topicArn }),
      });

      // ALB Target Health Alarm
      const targetHealthAlarm = new Alarm(this, 'TargetHealthAlarm', {
        alarmName: `${environment}-alb-target-health`,
        metric: targetGroup.metricHealthyHostCount({
          statistic: Statistic.AVERAGE,
          period: Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      });

      targetHealthAlarm.addAlarmAction({
        bind: () => ({ alarmActionArn: alertTopic.topicArn }),
      });

      // DynamoDB Throttling Alarms
      [eventsTable, participantsTable, usersTable, talksTable].forEach((table, index) => {
        const throttleAlarm = new Alarm(this, `DynamoDBThrottleAlarm${index}`, {
          alarmName: `${environment}-dynamodb-throttle-${table.tableName}`,
          metric: table.metricThrottledRequests({
            statistic: Statistic.SUM,
            period: Duration.minutes(5),
          }),
          threshold: 5,
          evaluationPeriods: 2,
          comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        });

        throttleAlarm.addAlarmAction({
          bind: () => ({ alarmActionArn: alertTopic.topicArn }),
        });
      });

      // CloudWatch Dashboard
      const dashboard = new Dashboard(this, 'Dashboard', {
        dashboardName: `lightningtalk-${environment}-dashboard`,
        widgets: [
          [
            new GraphWidget({
              title: 'ECS Running Tasks',
              left: [service.metricRunningTaskCount()],
              width: 12,
              height: 6,
            }),
          ],
          [
            new GraphWidget({
              title: 'ALB Response Time',
              left: [targetGroup.metricTargetResponseTime()],
              width: 12,
              height: 6,
            }),
          ],
          [
            new GraphWidget({
              title: 'DynamoDB Consumed Read/Write Capacity',
              left: [
                eventsTable.metricConsumedReadCapacityUnits(),
                eventsTable.metricConsumedWriteCapacityUnits(),
              ],
              width: 12,
              height: 6,
            }),
          ],
        ],
      });
    }

    // =================================
    // Cost Monitoring
    // =================================
    
    if (enableCostMonitoring) {
      const budget = new Budget(this, 'Budget', {
        budget: {
          budgetName: `lightningtalk-${environment}-budget`,
          budgetLimit: {
            amount: 100, // $100 monthly budget
            unit: 'USD',
          },
          timeUnit: 'MONTHLY',
          costFilters: {
            service: ['Amazon Elastic Compute Cloud - Compute', 'Amazon DynamoDB', 'Amazon CloudFront'],
          },
        },
        notificationsWithSubscribers: [
          {
            notification: {
              comparisonOperator: 'GREATER_THAN',
              notificationType: 'ACTUAL',
              threshold: 80,
              thresholdType: 'PERCENTAGE',
            },
            subscribers: [
              {
                address: alertEmail,
                subscriptionType: 'EMAIL',
              },
            ],
          },
        ],
      });
    }

    // =================================
    // Storybook Infrastructure
    // =================================
    
    // S3 Bucket for Storybook Production
    const storybookBucket = new Bucket(this, 'StorybookBucket', {
      bucketName: `lightning-talk-storybook-production`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(30),
        },
      ],
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: ['GET', 'HEAD'],
          allowedOrigins: ['*'],
          exposedHeaders: [],
          maxAge: 3600,
        },
      ],
    });

    // S3 Bucket for Storybook Staging
    const storybookStagingBucket = new Bucket(this, 'StorybookStagingBucket', {
      bucketName: `lightning-talk-storybook-staging`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(30),
        },
      ],
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: ['GET', 'HEAD'],
          allowedOrigins: ['*'],
          exposedHeaders: [],
          maxAge: 3600,
        },
      ],
    });

    // OAI for Storybook
    const storybookOai = new OriginAccessIdentity(this, 'StorybookOAI', {
      comment: 'OAI for Storybook distributions',
    });

    storybookBucket.grantRead(storybookOai);
    storybookStagingBucket.grantRead(storybookOai);

    // CloudFront for Storybook Production
    const storybookDistribution = new Distribution(this, 'StorybookDistribution', {
      comment: 'Lightning Talk Circle Storybook Production',
      domainNames: ['storybook.xn--6wym69a.com'],
      certificate: certificate, // Use same certificate (needs to include storybook subdomain)
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(storybookBucket, {
          originAccessIdentity: storybookOai,
        }),
        viewerProtocolPolicy: 'redirect-to-https',
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(300),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(300),
        },
      ],
      enableLogging: false, // Disable logging for now
      webAclId: enableWaf ? webAcl.attrArn : undefined,
    });

    // CloudFront for Storybook Staging
    const storybookStagingDistribution = new Distribution(this, 'StorybookStagingDistribution', {
      comment: 'Lightning Talk Circle Storybook Staging',
      domainNames: ['storybook-staging.xn--6wym69a.com'],
      certificate: certificate, // Use same certificate (needs to include storybook-staging subdomain)
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(storybookStagingBucket, {
          originAccessIdentity: storybookOai,
        }),
        viewerProtocolPolicy: 'redirect-to-https',
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(300),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(300),
        },
      ],
      enableLogging: false, // Disable logging for now
      webAclId: enableWaf ? webAcl.attrArn : undefined,
    });

    // =================================
    // Outputs
    // =================================
    
    new CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new CfnOutput(this, 'DistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new CfnOutput(this, 'StaticBucketName', {
      value: staticBucket.bucketName,
      description: 'S3 bucket name for static assets',
    });

    new CfnOutput(this, 'SecretsArn', {
      value: appSecrets.secretArn,
      description: 'Secrets Manager ARN for application secrets',
    });

    new CfnOutput(this, 'StorybookProductionDistributionId', {
      value: storybookDistribution.distributionId,
      description: 'CloudFront Distribution ID for Storybook Production',
    });

    new CfnOutput(this, 'StorybookStagingDistributionId', {
      value: storybookStagingDistribution.distributionId,
      description: 'CloudFront Distribution ID for Storybook Staging',
    });

    new CfnOutput(this, 'StorybookProductionBucket', {
      value: storybookBucket.bucketName,
      description: 'S3 Bucket for Storybook Production',
    });

    new CfnOutput(this, 'StorybookStagingBucket', {
      value: storybookStagingBucket.bucketName,
      description: 'S3 Bucket for Storybook Staging',
    });

    // Export values for cross-stack references
    this.albDnsName = alb.loadBalancerDnsName;
    this.distributionDomain = distribution.distributionDomainName;
    this.staticBucketName = staticBucket.bucketName;
    this.secretsArn = appSecrets.secretArn;
    
    this.tables = {
      events: eventsTable,
      participants: participantsTable,
      users: usersTable,
      talks: talksTable,
    };
  }
}

module.exports = { ProdEnvironmentStack };