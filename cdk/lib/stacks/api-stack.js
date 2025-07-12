const { Stack, Duration, CfnOutput } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const ecs = require('aws-cdk-lib/aws-ecs');
const ecr = require('aws-cdk-lib/aws-ecr');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const logs = require('aws-cdk-lib/aws-logs');
const iam = require('aws-cdk-lib/aws-iam');
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const route53 = require('aws-cdk-lib/aws-route53');
const targets = require('aws-cdk-lib/aws-route53-targets');
const wafv2 = require('aws-cdk-lib/aws-wafv2');

class ApiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, databaseStack, secretsStack } = props;
    const { vpc } = databaseStack;
    
    // API URL is optional for development environments
    // Will use AWS-generated URL if custom domain is not configured
    
    // Production safety check
    if (config.app.stage === 'production') {
      console.warn('⚠️  Deploying API to PRODUCTION environment');
      console.warn('⚠️  ECS service will use production-grade settings');
    }

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
      enableLogging: config.monitoring.enableDetailedMonitoring,
    });

    // Create log group
    const logRetentionMap = {
      1: logs.RetentionDays.ONE_DAY,
      3: logs.RetentionDays.THREE_DAYS,
      5: logs.RetentionDays.FIVE_DAYS,
      7: logs.RetentionDays.ONE_WEEK,
      14: logs.RetentionDays.TWO_WEEKS,
      30: logs.RetentionDays.ONE_MONTH,
      60: logs.RetentionDays.TWO_MONTHS,
      90: logs.RetentionDays.THREE_MONTHS,
      120: logs.RetentionDays.FOUR_MONTHS,
      150: logs.RetentionDays.FIVE_MONTHS,
      180: logs.RetentionDays.SIX_MONTHS,
      365: logs.RetentionDays.ONE_YEAR,
      400: logs.RetentionDays.THIRTEEN_MONTHS,
      545: logs.RetentionDays.EIGHTEEN_MONTHS,
      731: logs.RetentionDays.TWO_YEARS,
    };
    
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/ecs/${config.app.name}-api`,
      retention: logRetentionMap[config.monitoring.logRetention] || logs.RetentionDays.ONE_WEEK,
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

    // Grant secrets access to task
    if (secretsStack) {
      secretsStack.grantRead(taskDefinition.taskRole);
    }

    // Grant DynamoDB access to task
    databaseStack.grantTableAccess(taskDefinition.taskRole);

    // Create application secrets with both JWT and session secrets
    const appSecrets = new secretsmanager.Secret(this, 'AppSecrets', {
      secretName: `${config.app.name}/${config.app.stage}/app/secrets`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          jwt_secret: '',
          session_secret: ''
        }),
        generateStringKey: 'jwt_secret',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/\\@"',
        passwordLength: 64,
      },
    });

    // Create a separate secret for session
    const sessionSecret = new secretsmanager.Secret(this, 'SessionSecret', {
      secretName: `${config.app.name}/${config.app.stage}/session/secret`,
      generateSecretString: {
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/\\@"',
        passwordLength: 64,
      },
    });

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
        DATABASE_TYPE: 'dynamodb',
        AWS_REGION: this.region,
        DYNAMODB_EVENTS_TABLE: databaseStack.eventsTable.tableName,
        DYNAMODB_PARTICIPANTS_TABLE: databaseStack.participantsTable.tableName,
        DYNAMODB_USERS_TABLE: databaseStack.usersTable.tableName,
        DYNAMODB_TALKS_TABLE: databaseStack.talksTable.tableName,
      },
      secrets: {
        JWT_SECRET: ecs.Secret.fromSecretsManager(appSecrets, 'jwt_secret'),
        SESSION_SECRET: ecs.Secret.fromSecretsManager(sessionSecret),
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

    // Create SSL certificate for HTTPS
    let certificate;
    let hostedZone;
    
    if (config.api && config.api.domain && config.api.domain.domainName) {
      // Look up existing hosted zone
      hostedZone = route53.HostedZone.fromLookup(this, 'ApiHostedZone', {
        domainName: config.api.domain.zoneName || config.api.domain.domainName,
      });
      
      // Create SSL certificate
      certificate = new acm.Certificate(this, 'ApiCertificate', {
        domainName: config.api.domain.domainName,
        subjectAlternativeNames: config.api.domain.alternativeNames || [],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
    }

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

    // Associate WAF ACL with ALB if provided
    if (props.wafAclArn) {
      new wafv2.CfnWebACLAssociation(this, 'ApiWafAssociation', {
        resourceArn: this.alb.loadBalancerArn,
        webAclArn: props.wafAclArn,
      });
    }

    // Add HTTPS listener if certificate is available
    if (certificate) {
      const httpsListener = this.alb.addListener('ApiHttpsListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [targetGroup],
      });


      // Configure security headers via target group attributes
      targetGroup.setAttribute('stickiness.enabled', 'false');
      targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30');
      
      // Add HTTP listener that redirects to HTTPS
      const httpListener = this.alb.addListener('ApiHttpListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });
      
      this.apiUrl = `https://${config.api.domain.domainName}`;
    } else {
      // Fallback to HTTP listener for development
      const httpListener = this.alb.addListener('ApiHttpListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [targetGroup],
      });
      
      this.apiUrl = `http://${this.alb.loadBalancerDnsName}`;
    }

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

    // Allow ECS service to access DynamoDB and other AWS services
    serviceSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS for AWS services'
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

    // Create Route53 A record if custom domain is configured
    if (hostedZone && config.api && config.api.domain && config.api.domain.domainName) {
      new route53.ARecord(this, 'ApiAliasRecord', {
        zone: hostedZone,
        recordName: config.api.domain.domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(this.alb)
        ),
      });
    }

    // API URL is set above based on certificate availability
  }
}

module.exports = { ApiStack };