/**
 * Enhanced Monitoring Stack
 * 本番環境向けCloudWatch統合監視システム
 */

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface MonitoringEnhancedStackProps extends cdk.StackProps {
  environment: string;
  alertEmail?: string;
  lambdaFunctionName?: string;
  logGroupName?: string;
}

export class MonitoringEnhancedStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringEnhancedStackProps) {
    super(scope, id, props);

    const { environment, alertEmail, lambdaFunctionName, logGroupName } = props;

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `lightningtalk-alerts-${environment}`,
      displayName: `Lightning Talk Circle Alerts (${environment})`
    });

    // Email subscription for alerts
    if (alertEmail) {
      this.alertTopic.addSubscription(new snsSubscriptions.EmailSubscription(alertEmail));
    }

    // Log Group for structured logs
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: logGroupName || `/aws/lambda/lightningtalk-circle-${environment}`,
      retention:
        environment === 'production' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy:
        environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    });

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `LightningTalkCircle-${environment}`,
      defaultInterval: cdk.Duration.hours(1)
    });

    // Lambda Function Metrics (if provided)
    if (lambdaFunctionName) {
      this.createLambdaMonitoring(lambdaFunctionName, environment);
    }

    // Application Logs Monitoring
    this.createLogMonitoring(logGroup, environment);

    // Custom Metrics from Application
    this.createCustomMetrics(environment);

    // Security Monitoring
    this.createSecurityMonitoring(logGroup, environment);

    // Performance Monitoring
    this.createPerformanceMonitoring(environment);

    // Business Metrics
    this.createBusinessMetrics(environment);
  }

  private createLambdaMonitoring(functionName: string, environment: string) {
    // Lambda function metrics
    const lambdaFunction = lambda.Function.fromFunctionName(this, 'LambdaFunction', functionName);

    // Duration widget
    const durationWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Duration',
      left: [
        lambdaFunction.metricDuration({
          statistic: 'Average'
        }),
        lambdaFunction.metricDuration({
          statistic: 'Maximum'
        })
      ],
      width: 12,
      height: 6
    });

    // Error rate widget
    const errorWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Errors & Invocations',
      left: [lambdaFunction.metricInvocations(), lambdaFunction.metricErrors()],
      right: [lambdaFunction.metricThrottles()],
      width: 12,
      height: 6
    });

    // Add to dashboard
    this.dashboard.addWidgets(durationWidget, errorWidget);

    // Alarms
    const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: `lightningtalk-high-error-rate-${environment}`,
      alarmDescription: 'Lambda function error rate is high',
      metric: lambdaFunction.metricErrorRate(),
      threshold: 0.05, // 5% error rate
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const highDurationAlarm = new cloudwatch.Alarm(this, 'HighDurationAlarm', {
      alarmName: `lightningtalk-high-duration-${environment}`,
      alarmDescription: 'Lambda function duration is high',
      metric: lambdaFunction.metricDuration({
        statistic: 'Average'
      }),
      threshold: 10000, // 10 seconds
      evaluationPeriods: 3
    });

    // Connect alarms to SNS
    highErrorRateAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
    highDurationAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
  }

  private createLogMonitoring(logGroup: logs.LogGroup, environment: string) {
    // Error log metric filter
    const errorMetricFilter = new logs.MetricFilter(this, 'ErrorMetricFilter', {
      logGroup,
      metricNamespace: 'LightningTalkCircle/Application',
      metricName: 'ErrorCount',
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'ERROR'),
      metricValue: '1'
    });

    // Warning log metric filter
    const warningMetricFilter = new logs.MetricFilter(this, 'WarningMetricFilter', {
      logGroup,
      metricNamespace: 'LightningTalkCircle/Application',
      metricName: 'WarningCount',
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'WARN'),
      metricValue: '1'
    });

    // Security events metric filter
    const securityMetricFilter = new logs.MetricFilter(this, 'SecurityMetricFilter', {
      logGroup,
      metricNamespace: 'LightningTalkCircle/Security',
      metricName: 'SecurityEventCount',
      filterPattern: logs.FilterPattern.exists('$.securityEvent'),
      metricValue: '1'
    });

    // Create metrics from filters
    const errorMetric = errorMetricFilter.metric();
    const warningMetric = warningMetricFilter.metric();
    const securityMetric = securityMetricFilter.metric();

    // Log monitoring widget
    const logWidget = new cloudwatch.GraphWidget({
      title: 'Application Log Metrics',
      left: [errorMetric, warningMetric],
      right: [securityMetric],
      width: 24,
      height: 6
    });

    this.dashboard.addWidgets(logWidget);

    // High error count alarm
    const highErrorCountAlarm = new cloudwatch.Alarm(this, 'HighErrorCountAlarm', {
      alarmName: `lightningtalk-high-error-count-${environment}`,
      alarmDescription: 'High number of application errors detected',
      metric: errorMetric,
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // Security event alarm
    const securityEventAlarm = new cloudwatch.Alarm(this, 'SecurityEventAlarm', {
      alarmName: `lightningtalk-security-event-${environment}`,
      alarmDescription: 'Security event detected',
      metric: securityMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    highErrorCountAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
    securityEventAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
  }

  private createCustomMetrics(environment: string) {
    // Custom metrics from application
    const performanceMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Performance',
      metricName: 'RequestDuration',
      statistic: 'Average'
    });

    const userActivityMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Business',
      metricName: 'UserActivity',
      statistic: 'Sum'
    });

    const mobileUsageMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Mobile',
      metricName: 'MobileUsage',
      statistic: 'Sum'
    });

    // Performance widget
    const performanceWidget = new cloudwatch.GraphWidget({
      title: 'Application Performance',
      left: [performanceMetric],
      width: 12,
      height: 6
    });

    // User activity widget
    const activityWidget = new cloudwatch.GraphWidget({
      title: 'User Activity & Mobile Usage',
      left: [userActivityMetric],
      right: [mobileUsageMetric],
      width: 12,
      height: 6
    });

    this.dashboard.addWidgets(performanceWidget, activityWidget);

    // Performance alarm
    const slowPerformanceAlarm = new cloudwatch.Alarm(this, 'SlowPerformanceAlarm', {
      alarmName: `lightningtalk-slow-performance-${environment}`,
      alarmDescription: 'Application performance is degraded',
      metric: performanceMetric,
      threshold: 2000, // 2 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    slowPerformanceAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
  }

  private createSecurityMonitoring(logGroup: logs.LogGroup, environment: string) {
    // Authentication failures
    const authFailureFilter = new logs.MetricFilter(this, 'AuthFailureFilter', {
      logGroup,
      metricNamespace: 'LightningTalkCircle/Security',
      metricName: 'AuthenticationFailures',
      filterPattern: logs.FilterPattern.all(
        logs.FilterPattern.stringValue('$.level', '=', 'WARN'),
        logs.FilterPattern.stringValue('$.securityEvent', '=', 'Failed authentication attempt')
      ),
      metricValue: '1'
    });

    // Suspicious requests
    const suspiciousRequestFilter = new logs.MetricFilter(this, 'SuspiciousRequestFilter', {
      logGroup,
      metricNamespace: 'LightningTalkCircle/Security',
      metricName: 'SuspiciousRequests',
      filterPattern: logs.FilterPattern.all(
        logs.FilterPattern.stringValue('$.level', '=', 'WARN'),
        logs.FilterPattern.stringValue('$.securityEvent', '=', 'Suspicious request detected')
      ),
      metricValue: '1'
    });

    const authFailureMetric = authFailureFilter.metric();
    const suspiciousMetric = suspiciousRequestFilter.metric();

    // Security dashboard widget
    const securityWidget = new cloudwatch.GraphWidget({
      title: 'Security Metrics',
      left: [authFailureMetric],
      right: [suspiciousMetric],
      width: 24,
      height: 6
    });

    this.dashboard.addWidgets(securityWidget);

    // High authentication failure alarm
    const authFailureAlarm = new cloudwatch.Alarm(this, 'AuthFailureAlarm', {
      alarmName: `lightningtalk-auth-failures-${environment}`,
      alarmDescription: 'High number of authentication failures',
      metric: authFailureMetric,
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    authFailureAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
  }

  private createPerformanceMonitoring(environment: string) {
    // Mobile performance metrics
    const mobileFPSMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Mobile',
      metricName: 'AverageFPS',
      statistic: 'Average'
    });

    const mobileMemoryMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Mobile',
      metricName: 'MemoryUsage',
      statistic: 'Average'
    });

    const touchLatencyMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Mobile',
      metricName: 'TouchLatency',
      statistic: 'Average'
    });

    // Mobile performance widget
    const mobilePerformanceWidget = new cloudwatch.GraphWidget({
      title: 'Mobile Performance Metrics',
      left: [mobileFPSMetric],
      right: [mobileMemoryMetric, touchLatencyMetric],
      width: 24,
      height: 6
    });

    this.dashboard.addWidgets(mobilePerformanceWidget);

    // Mobile performance alarms
    const lowFPSAlarm = new cloudwatch.Alarm(this, 'LowFPSAlarm', {
      alarmName: `lightningtalk-low-fps-${environment}`,
      alarmDescription: 'Mobile FPS is below threshold',
      metric: mobileFPSMetric,
      threshold: 30,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const highMemoryAlarm = new cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      alarmName: `lightningtalk-high-memory-${environment}`,
      alarmDescription: 'Mobile memory usage is high',
      metric: mobileMemoryMetric,
      threshold: 100, // 100MB
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    lowFPSAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
    highMemoryAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
  }

  private createBusinessMetrics(environment: string) {
    // Business event metrics
    const eventRegistrationMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Business',
      metricName: 'EventRegistrations',
      statistic: 'Sum'
    });

    const talkSubmissionMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Business',
      metricName: 'TalkSubmissions',
      statistic: 'Sum'
    });

    const votingActivityMetric = new cloudwatch.Metric({
      namespace: 'LightningTalkCircle/Business',
      metricName: 'VotingActivity',
      statistic: 'Sum'
    });

    // Business metrics widget
    const businessWidget = new cloudwatch.GraphWidget({
      title: 'Business Metrics',
      left: [eventRegistrationMetric, talkSubmissionMetric],
      right: [votingActivityMetric],
      width: 24,
      height: 6
    });

    this.dashboard.addWidgets(businessWidget);

    // Summary widget with key metrics
    const summaryWidget = new cloudwatch.SingleValueWidget({
      title: 'Key Performance Indicators',
      metrics: [eventRegistrationMetric, talkSubmissionMetric, votingActivityMetric],
      width: 24,
      height: 6
    });

    this.dashboard.addWidgets(summaryWidget);
  }
}
