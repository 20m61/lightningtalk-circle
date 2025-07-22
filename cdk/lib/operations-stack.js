/**
 * Lightning Talk Circle - Operations Stack
 * 監視、アラート、コスト管理、運用ツールを管理
 */

const { Stack, Duration, CfnOutput } = require('aws-cdk-lib');
const { Alarm, Metric, ComparisonOperator, TreatMissingData, Dashboard, GraphWidget, TextWidget, SingleValueWidget } = require('aws-cdk-lib/aws-cloudwatch');
const { SnsAction } = require('aws-cdk-lib/aws-cloudwatch-actions');
const { Topic } = require('aws-cdk-lib/aws-sns');
const { EmailSubscription } = require('aws-cdk-lib/aws-sns-subscriptions');
const { CfnBudget } = require('aws-cdk-lib/aws-budgets');
const { StringParameter } = require('aws-cdk-lib/aws-ssm');

class OperationsStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config, environment, applicationStack } = props;
    const isProd = environment === 'prod';

    // Environment-specific thresholds
    const thresholds = {
      dev: {
        apiErrorRate: 10, // 10%
        api4xxRate: 20, // 20%
        api5xxRate: 5, // 5%
        lambdaDuration: 5000, // 5 seconds
        lambdaErrors: 5, // 5 errors per 5 minutes
        dynamodbThrottle: 1, // Any throttling
        monthlyBudget: 100, // $100
      },
      prod: {
        apiErrorRate: 5, // 5%
        api4xxRate: 10, // 10%
        api5xxRate: 1, // 1%
        lambdaDuration: 3000, // 3 seconds
        lambdaErrors: 10, // 10 errors per 5 minutes
        dynamodbThrottle: 5, // 5 throttles per minute
        monthlyBudget: 1000, // $1000
      },
    };

    const limits = thresholds[environment] || thresholds.dev;

    // SNS Topic for alerts
    this.alertTopic = new Topic(this, 'AlertTopic', {
      topicName: `${config.projectName}-${environment}-alerts`,
      displayName: `Lightning Talk Circle ${environment} Alerts`,
    });

    // Add email subscription if provided
    if (config.alertEmail) {
      this.alertTopic.addSubscription(new EmailSubscription(config.alertEmail));
    }

    // Lambda Function Metrics and Alarms
    const lambdaFunctionName = applicationStack.apiFunction.functionName;

    // Lambda Duration Alarm
    new Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `${config.projectName}-${environment}-lambda-duration`,
      alarmDescription: 'Lambda function duration is too high',
      metric: new Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        dimensionsMap: {
          FunctionName: lambdaFunctionName,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: limits.lambdaDuration,
      evaluationPeriods: 2,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new SnsAction(this.alertTopic));

    // Lambda Errors Alarm
    new Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `${config.projectName}-${environment}-lambda-errors`,
      alarmDescription: 'Lambda function errors detected',
      metric: new Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: lambdaFunctionName,
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: limits.lambdaErrors,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new SnsAction(this.alertTopic));

    // Lambda Throttles Alarm
    new Alarm(this, 'LambdaThrottlesAlarm', {
      alarmName: `${config.projectName}-${environment}-lambda-throttles`,
      alarmDescription: 'Lambda function throttling detected',
      metric: new Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        dimensionsMap: {
          FunctionName: lambdaFunctionName,
        },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new SnsAction(this.alertTopic));

    // API Gateway Metrics and Alarms
    const apiName = applicationStack.api.restApiName;

    // API 4XX Errors Alarm
    new Alarm(this, 'API4xxAlarm', {
      alarmName: `${config.projectName}-${environment}-api-4xx`,
      alarmDescription: 'High 4XX error rate on API',
      metric: new Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: apiName,
          Stage: environment,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: limits.api4xxRate / 100,
      evaluationPeriods: 2,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new SnsAction(this.alertTopic));

    // API 5XX Errors Alarm
    new Alarm(this, 'API5xxAlarm', {
      alarmName: `${config.projectName}-${environment}-api-5xx`,
      alarmDescription: 'High 5XX error rate on API',
      metric: new Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: apiName,
          Stage: environment,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: limits.api5xxRate / 100,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new SnsAction(this.alertTopic));

    // CloudFront Metrics
    const distributionId = applicationStack.distribution.distributionId;

    // CloudFront Origin Errors Alarm
    new Alarm(this, 'CloudFrontOriginErrorsAlarm', {
      alarmName: `${config.projectName}-${environment}-cloudfront-origin-errors`,
      alarmDescription: 'High origin error rate on CloudFront',
      metric: new Metric({
        namespace: 'AWS/CloudFront',
        metricName: 'OriginLatency',
        dimensionsMap: {
          DistributionId: distributionId,
          Region: 'Global',
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 2,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new SnsAction(this.alertTopic));

    // Cost Budget
    new CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: `${config.projectName}-${environment}-monthly`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: limits.monthlyBudget,
          unit: 'USD',
        },
        costTypes: {
          includeCredit: false,
          includeDiscount: true,
          includeOtherSubscription: true,
          includeRecurring: true,
          includeRefund: false,
          includeSubscription: true,
          includeSupport: true,
          includeTax: true,
          includeUpfront: true,
          useAmortized: false,
          useBlended: false,
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
          subscribers: config.alertEmail ? [{
            address: config.alertEmail,
            subscriptionType: 'EMAIL',
          }] : [],
        },
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'FORECASTED',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: config.alertEmail ? [{
            address: config.alertEmail,
            subscriptionType: 'EMAIL',
          }] : [],
        },
      ],
    });

    // CloudWatch Dashboard
    this.dashboard = new Dashboard(this, 'OperationsDashboard', {
      dashboardName: `${config.projectName}-${environment}`,
      defaultInterval: Duration.hours(3),
    });

    // Dashboard Header
    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `# Lightning Talk Circle - ${environment.toUpperCase()} Environment
## Real-time Monitoring Dashboard
Last updated: ${new Date().toISOString()}`,
        width: 24,
        height: 2,
      })
    );

    // API Metrics Row
    this.dashboard.addWidgets(
      new GraphWidget({
        title: 'API Request Count',
        left: [new Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: apiName,
            Stage: environment,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
        })],
        width: 8,
      }),
      new GraphWidget({
        title: 'API Latency',
        left: [new Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: apiName,
            Stage: environment,
          },
          statistic: 'Average',
          period: Duration.minutes(5),
        })],
        width: 8,
      }),
      new GraphWidget({
        title: 'API Errors',
        left: [
          new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              ApiName: apiName,
              Stage: environment,
            },
            statistic: 'Sum',
            period: Duration.minutes(5),
            label: '4XX Errors',
          }),
          new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              ApiName: apiName,
              Stage: environment,
            },
            statistic: 'Sum',
            period: Duration.minutes(5),
            label: '5XX Errors',
          }),
        ],
        width: 8,
      })
    );

    // Lambda Metrics Row
    this.dashboard.addWidgets(
      new GraphWidget({
        title: 'Lambda Invocations',
        left: [new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          dimensionsMap: {
            FunctionName: lambdaFunctionName,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
        })],
        width: 8,
      }),
      new GraphWidget({
        title: 'Lambda Duration',
        left: [new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          dimensionsMap: {
            FunctionName: lambdaFunctionName,
          },
          statistic: 'Average',
          period: Duration.minutes(5),
        })],
        width: 8,
      }),
      new GraphWidget({
        title: 'Lambda Errors & Throttles',
        left: [
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: lambdaFunctionName,
            },
            statistic: 'Sum',
            period: Duration.minutes(5),
            label: 'Errors',
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Throttles',
            dimensionsMap: {
              FunctionName: lambdaFunctionName,
            },
            statistic: 'Sum',
            period: Duration.minutes(5),
            label: 'Throttles',
          }),
        ],
        width: 8,
      })
    );

    // Summary Widgets
    this.dashboard.addWidgets(
      new SingleValueWidget({
        title: 'Total API Requests (24h)',
        metrics: [new Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: apiName,
            Stage: environment,
          },
          statistic: 'Sum',
          period: Duration.days(1),
        })],
        width: 6,
      }),
      new SingleValueWidget({
        title: 'Average API Latency (24h)',
        metrics: [new Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: apiName,
            Stage: environment,
          },
          statistic: 'Average',
          period: Duration.days(1),
        })],
        width: 6,
      }),
      new SingleValueWidget({
        title: 'Error Rate (24h)',
        metrics: [new Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: apiName,
            Stage: environment,
          },
          statistic: 'Average',
          period: Duration.days(1),
        })],
        width: 6,
      }),
      new SingleValueWidget({
        title: 'Lambda Invocations (24h)',
        metrics: [new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          dimensionsMap: {
            FunctionName: lambdaFunctionName,
          },
          statistic: 'Sum',
          period: Duration.days(1),
        })],
        width: 6,
      })
    );

    // Outputs
    new CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });

    new CfnOutput(this, 'DashboardURL', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}

module.exports = { OperationsStack };