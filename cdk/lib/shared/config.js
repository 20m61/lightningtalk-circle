function getConfig(environment) {
  const environmentConfigs = {
    dev: {
      app: {
        name: 'lightningtalk-circle',
        version: '2.0.0',
        stage: 'development'
      },
      aws: {
        region: 'ap-northeast-1',
        accountId: process.env.AWS_ACCOUNT_ID_DEV || process.env.CDK_DEFAULT_ACCOUNT
      },
      database: {
        engine: 'postgres',
        version: '15.4',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        multiAz: false,
        deletionProtection: false,
        backupRetention: 7,
        enablePerformanceInsights: false
      },
      cache: {
        nodeType: 'cache.t3.micro',
        numNodes: 1,
        enableBackup: false
      },
      api: {
        cpu: 512,
        memory: 1024,
        desiredCount: 1,
        maxCapacity: 3,
        minCapacity: 1,
        enableLogging: true
      },
      monitoring: {
        enableDetailedMonitoring: false,
        logRetention: 14,
        alertEmail: 'dev-alerts@lightningtalk-circle.com',
        enableXRayTracing: false
      },
      security: {
        enableWaf: false,
        enableGuardDuty: false,
        allowedIpRanges: [],
        enableVpcFlowLogs: false
      }
    },
    
    staging: {
      app: {
        name: 'lightningtalk-circle',
        version: '2.0.0',
        stage: 'staging'
      },
      aws: {
        region: 'ap-northeast-1',
        accountId: process.env.AWS_ACCOUNT_ID_STAGING || process.env.CDK_DEFAULT_ACCOUNT
      },
      database: {
        engine: 'postgres',
        version: '15.4',
        instanceClass: 'db.t3.small',
        allocatedStorage: 50,
        multiAz: true,
        deletionProtection: true,
        backupRetention: 14,
        enablePerformanceInsights: true
      },
      cache: {
        nodeType: 'cache.t3.small',
        numNodes: 2,
        enableBackup: true
      },
      api: {
        cpu: 1024,
        memory: 2048,
        desiredCount: 2,
        maxCapacity: 6,
        minCapacity: 1,
        enableLogging: true
      },
      monitoring: {
        enableDetailedMonitoring: true,
        logRetention: 30,
        alertEmail: 'staging-alerts@lightningtalk-circle.com',
        enableXRayTracing: true
      },
      security: {
        enableWaf: true,
        enableGuardDuty: true,
        allowedIpRanges: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
        enableVpcFlowLogs: true
      }
    },
    
    prod: {
      app: {
        name: 'lightningtalk-circle',
        version: '2.0.0',
        stage: 'production'
      },
      aws: {
        region: 'ap-northeast-1',
        accountId: process.env.AWS_ACCOUNT_ID_PROD || process.env.CDK_DEFAULT_ACCOUNT
      },
      database: {
        engine: 'postgres',
        version: '15.4',
        instanceClass: 'db.t3.medium',
        allocatedStorage: 100,
        multiAz: true,
        deletionProtection: true,
        backupRetention: 30,
        enablePerformanceInsights: true
      },
      cache: {
        nodeType: 'cache.t3.small',
        numNodes: 3,
        enableBackup: true
      },
      api: {
        cpu: 2048,
        memory: 4096,
        desiredCount: 3,
        maxCapacity: 10,
        minCapacity: 2,
        enableLogging: true
      },
      monitoring: {
        enableDetailedMonitoring: true,
        logRetention: 90,
        alertEmail: 'prod-alerts@lightningtalk-circle.com',
        enableXRayTracing: true
      },
      security: {
        enableWaf: true,
        enableGuardDuty: true,
        allowedIpRanges: [],
        enableVpcFlowLogs: true
      }
    }
  };

  const config = environmentConfigs[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}. Available environments: ${Object.keys(environmentConfigs).join(', ')}`);
  }

  return config;
}

module.exports = { getConfig };