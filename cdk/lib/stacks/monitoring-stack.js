const { Stack, Duration } = require('aws-cdk-lib');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const cwactions = require('aws-cdk-lib/aws-cloudwatch-actions');
const sns = require('aws-cdk-lib/aws-sns');
const subscriptions = require('aws-cdk-lib/aws-sns-subscriptions');
const lambda = require('aws-cdk-lib/aws-lambda');
const iam = require('aws-cdk-lib/aws-iam');

class MonitoringStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, databaseStack, apiService, alb } = props;

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `${config.app.name}-alerts-${config.app.stage}`,
      displayName: `Lightning Talk ${config.app.stage} Alerts`,
    });

    // Add email subscription if configured
    if (config.monitoring.alertEmail) {
      alertTopic.addSubscription(
        new subscriptions.EmailSubscription(config.monitoring.alertEmail)
      );
    }

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `${config.app.name}-${config.app.stage}-dashboard`,
    });

    // DynamoDB Metrics
    const tables = [
      { name: databaseStack.eventsTable.tableName, label: 'Events' },
      { name: databaseStack.participantsTable.tableName, label: 'Participants' },
      { name: databaseStack.usersTable.tableName, label: 'Users' },
      { name: databaseStack.talksTable.tableName, label: 'Talks' }
    ];
    
    const dbReadMetrics = tables.map(table => new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedReadCapacityUnits',
      dimensionsMap: {
        TableName: table.name,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
      label: `${table.label} Read`,
    }));

    const dbWriteMetrics = tables.map(table => new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedWriteCapacityUnits',
      dimensionsMap: {
        TableName: table.name,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
      label: `${table.label} Write`,
    }));

    const dbThrottleMetrics = tables.map(table => new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'UserErrors',
      dimensionsMap: {
        TableName: table.name,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
      label: `${table.label} Errors`,
    }));


    // ECS Metrics
    const ecsCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        ServiceName: apiService.serviceName,
        ClusterName: apiService.cluster.clusterName,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    });

    const ecsMemoryMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'MemoryUtilization',
      dimensionsMap: {
        ServiceName: apiService.serviceName,
        ClusterName: apiService.cluster.clusterName,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    });

    // ALB Metrics
    const albTargetResponseTimeMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'TargetResponseTime',
      dimensionsMap: {
        LoadBalancer: alb.loadBalancerFullName,
      },
      statistic: 'Average',
      period: Duration.minutes(1),
    });

    const alb4xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_4XX_Count',
      dimensionsMap: {
        LoadBalancer: alb.loadBalancerFullName,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    const alb5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensionsMap: {
        LoadBalancer: alb.loadBalancerFullName,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    // Create Alarms
    // DynamoDB throttle alarms
    tables.forEach((table, index) => {
      new cloudwatch.Alarm(this, `${table.label}ThrottleAlarm`, {
        metric: dbThrottleMetrics[index],
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `${table.label} table is experiencing throttling`,
      }).addAlarmAction(new cwactions.SnsAction(alertTopic));
    });

    new cloudwatch.Alarm(this, 'EcsCpuAlarm', {
      metric: ecsCpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'ECS service CPU utilization is too high',
    }).addAlarmAction(new cwactions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'EcsMemoryAlarm', {
      metric: ecsMemoryMetric,
      threshold: 85,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'ECS service memory utilization is too high',
    }).addAlarmAction(new cwactions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'ResponseTimeAlarm', {
      metric: albTargetResponseTimeMetric,
      threshold: 2, // 2 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Application response time is too high',
    }).addAlarmAction(new cwactions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'Error5xxAlarm', {
      metric: alb5xxMetric,
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Too many 5XX errors',
    }).addAlarmAction(new cwactions.SnsAction(alertTopic));

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read Capacity',
        left: dbReadMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Write Capacity',
        left: dbWriteMetrics,
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS Service Metrics',
        left: [ecsCpuMetric],
        right: [ecsMemoryMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Application Performance',
        left: [albTargetResponseTimeMetric],
        right: [alb4xxMetric, alb5xxMetric],
        width: 12,
        height: 6,
      })
    );

    // Create custom metrics Lambda (if needed)
    if (config.monitoring.enableXRayTracing) {
      const metricsLambda = new lambda.Function(this, 'CustomMetricsLambda', {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const AWS = require('aws-sdk');
          const cloudwatch = new AWS.CloudWatch();
          
          exports.handler = async (event) => {
            // Custom metrics logic here
            console.log('Custom metrics collection');
            return { statusCode: 200 };
          };
        `),
        environment: {
          ENVIRONMENT: config.app.stage,
        },
        timeout: Duration.seconds(60),
        tracing: lambda.Tracing.ACTIVE,
      });

      // Grant permissions
      metricsLambda.addToRolePolicy(new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      }));
    }
  }
}

module.exports = { MonitoringStack };