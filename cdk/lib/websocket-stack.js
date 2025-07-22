const { Stack, CfnOutput, Duration, RemovalPolicy } = require('aws-cdk-lib');
const apigatewayv2 = require('aws-cdk-lib/aws-apigatewayv2');
const apigatewayv2Integrations = require('aws-cdk-lib/aws-apigatewayv2-integrations');
const lambda = require('aws-cdk-lib/aws-lambda');
const iam = require('aws-cdk-lib/aws-iam');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const path = require('path');

class WebSocketStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // WebSocket接続管理用のDynamoDBテーブル
    const connectionsTable = new dynamodb.Table(this, 'WebSocketConnections', {
      tableName: `lightningtalk-websocket-connections-${props.isProd ? 'prod' : 'dev'}`,
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    // WebSocket Lambda実行ロール
    const wsLambdaRole = new iam.Role(this, 'WebSocketLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:DeleteItem',
                'dynamodb:Scan',
                'dynamodb:Query'
              ],
              resources: [
                connectionsTable.tableArn,
                `arn:aws:dynamodb:${this.region}:${this.account}:table/lightningtalk-circle-*`
              ]
            })
          ]
        }),
        WebSocketManagement: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['execute-api:ManageConnections'],
              resources: ['*']
            })
          ]
        })
      }
    });

    // 共通のLambda設定
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      role: wsLambdaRole,
      timeout: Duration.seconds(30),
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        VOTES_TABLE: 'lightningtalk-circle-participation-votes'
      }
    };

    // WebSocket接続ハンドラー
    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      ...commonLambdaProps,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../server/websocket'))
    });

    // WebSocket切断ハンドラー
    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      ...commonLambdaProps,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../server/websocket'))
    });

    // WebSocketメッセージハンドラー
    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      ...commonLambdaProps,
      handler: 'message.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../server/websocket'))
    });

    // WebSocket API
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'VotingWebSocketApi', {
      apiName: 'lightningtalk-voting-ws',
      description: 'WebSocket API for real-time voting updates'
    });

    // WebSocketステージ
    const stage = new apigatewayv2.WebSocketStage(this, 'prod', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true
    });

    // ルート統合
    webSocketApi.addRoute('$connect', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'ConnectIntegration',
        connectHandler
      )
    });

    webSocketApi.addRoute('$disconnect', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'DisconnectIntegration',
        disconnectHandler
      )
    });

    webSocketApi.addRoute('$default', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'DefaultIntegration',
        messageHandler
      )
    });

    // 既存のAPIから投票更新を送信できるようにする
    const broadcastHandler = new lambda.Function(this, 'BroadcastHandler', {
      ...commonLambdaProps,
      handler: 'broadcast.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../server/websocket')),
      environment: {
        ...commonLambdaProps.environment,
        WEBSOCKET_API_ENDPOINT: stage.url
      }
    });

    // 出力
    new CfnOutput(this, 'WebSocketURL', {
      value: stage.url,
      description: 'WebSocket API URL'
    });

    new CfnOutput(this, 'ConnectionsTableName', {
      value: connectionsTable.tableName,
      description: 'WebSocket connections table name'
    });

    new CfnOutput(this, 'BroadcastFunctionArn', {
      value: broadcastHandler.functionArn,
      description: 'Broadcast Lambda function ARN',
      exportName: `VotingBroadcastFunctionArn-${props.isProd ? 'prod' : 'dev'}`
    });
  }
}

module.exports = { WebSocketStack };