const { Stack, RemovalPolicy, Duration, CfnOutput } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager');
const iam = require('aws-cdk-lib/aws-iam');

class DatabaseStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config } = props;
    
    // Production safety check
    if (config.app.stage === 'production') {
      console.warn('⚠️  Deploying to PRODUCTION environment');
      console.warn('⚠️  DynamoDB tables will be RETAINED on stack deletion');
      console.warn('⚠️  Point-in-time recovery is ENABLED');
    }

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
      ],
    });

    // Create DynamoDB tables instead of RDS
    // Events table
    this.eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: `${config.app.name}-${config.app.stage}-events`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: config.app.environment === 'production' 
        ? RemovalPolicy.RETAIN 
        : RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: config.app.environment === 'production',
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for date-based queries
    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'date-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Participants table
    this.participantsTable = new dynamodb.Table(this, 'ParticipantsTable', {
      tableName: `${config.app.name}-${config.app.stage}-participants`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: config.app.environment === 'production' 
        ? RemovalPolicy.RETAIN 
        : RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: config.app.environment === 'production',
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for event-based queries
    this.participantsTable.addGlobalSecondaryIndex({
      indexName: 'event-index',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Users table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${config.app.name}-${config.app.stage}-users`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: config.app.environment === 'production' 
        ? RemovalPolicy.RETAIN 
        : RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: config.app.environment === 'production',
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for email-based queries
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Talks table
    this.talksTable = new dynamodb.Table(this, 'TalksTable', {
      tableName: `${config.app.name}-${config.app.stage}-talks`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: config.app.environment === 'production' 
        ? RemovalPolicy.RETAIN 
        : RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: config.app.environment === 'production',
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for event-based queries
    this.talksTable.addGlobalSecondaryIndex({
      indexName: 'event-index',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'order', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create API credentials secret for DynamoDB access
    const apiCredentials = new secretsmanager.Secret(this, 'ApiCredentials', {
      secretName: `${config.app.name}/${config.app.stage}/api/credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ 
          apiKey: 'will-be-replaced',
          region: this.region 
        }),
        generateStringKey: 'apiSecret',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // Create bastion host if enabled (for troubleshooting)
    if (config.database.bastionHost?.enabled) {
      const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
        vpc: this.vpc,
        description: 'Security group for bastion host',
        allowAllOutbound: true,
      });

      // Allow SSH from specified IPs
      const allowedIps = config.database.bastionHost.allowedIps || ['0.0.0.0/0'];
      allowedIps.forEach((ip, index) => {
        bastionSecurityGroup.addIngressRule(
          ec2.Peer.ipv4(ip),
          ec2.Port.tcp(22),
          `SSH access from ${ip}`
        );
      });

      this.bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
        vpc: this.vpc,
        instanceName: `${config.app.name}-bastion`,
        machineImage: new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        }),
        securityGroup: bastionSecurityGroup,
        subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      });

      // Add CloudWatch agent for monitoring
      this.bastionHost.instance.addUserData(
        'yum install -y amazon-cloudwatch-agent',
        'amazon-cloudwatch-agent-ctl -a start'
      );
    }

    // Outputs
    new CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new CfnOutput(this, 'EventsTableName', {
      value: this.eventsTable.tableName,
      description: 'DynamoDB Events table name',
    });

    new CfnOutput(this, 'ParticipantsTableName', {
      value: this.participantsTable.tableName,
      description: 'DynamoDB Participants table name',
    });

    new CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'DynamoDB Users table name',
    });

    new CfnOutput(this, 'TalksTableName', {
      value: this.talksTable.tableName,
      description: 'DynamoDB Talks table name',
    });

    new CfnOutput(this, 'ApiCredentialsSecretArn', {
      value: apiCredentials.secretArn,
      description: 'API credentials secret ARN',
    });
  }

  // Method to grant read/write access to DynamoDB tables
  grantTableAccess(grantee) {
    this.eventsTable.grantReadWriteData(grantee);
    this.participantsTable.grantReadWriteData(grantee);
    this.usersTable.grantReadWriteData(grantee);
    this.talksTable.grantReadWriteData(grantee);
  }
}

module.exports = { DatabaseStack };