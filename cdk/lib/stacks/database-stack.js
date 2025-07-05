const { Stack, RemovalPolicy, Duration } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const rds = require('aws-cdk-lib/aws-rds');
const elasticache = require('aws-cdk-lib/aws-elasticache');
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager');

class DatabaseStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config } = props;

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'LightningTalkVpc', {
      maxAzs: 2,
      natGateways: config.database.multiAz ? 2 : 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    // Create security group for database
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Create database credentials secret
    const dbCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: `${config.app.name}/${config.app.stage}/database/credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // Create RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize[config.database.instanceClass.split('.')[2].toUpperCase()]
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      allocatedStorage: config.database.allocatedStorage,
      maxAllocatedStorage: config.database.allocatedStorage * 2,
      storageEncrypted: true,
      multiAz: config.database.multiAz,
      deletionProtection: config.database.deletionProtection,
      backupRetention: Duration.days(config.database.backupRetention),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enablePerformanceInsights: config.database.enablePerformanceInsights,
      credentials: rds.Credentials.fromSecret(dbCredentials),
      databaseName: 'lightningtalk',
      removalPolicy: config.database.deletionProtection
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
    });

    // Create security group for Redis
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ElastiCache Redis',
      allowAllOutbound: false,
    });

    // Create subnet group for Redis
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for ElastiCache Redis',
      subnetIds: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }).subnetIds,
    });

    // Create Redis cluster
    this.redis = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: config.cache.nodeType,
      engine: 'redis',
      numCacheNodes: config.cache.numNodes,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      snapshotRetentionLimit: config.cache.enableBackup ? 7 : 0,
      snapshotWindow: config.cache.enableBackup ? '04:00-05:00' : undefined,
    });

    // Store outputs
    this.dbSecurityGroup = dbSecurityGroup;
    this.redisSecurityGroup = redisSecurityGroup;
  }

  // Method to allow access from API stack
  allowAccessFrom(serviceSecurityGroup) {
    this.dbSecurityGroup.addIngressRule(
      serviceSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow from ECS service'
    );

    this.redisSecurityGroup.addIngressRule(
      serviceSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow from ECS service'
    );
  }
}

module.exports = { DatabaseStack };