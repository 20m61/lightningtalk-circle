const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} = require('@aws-sdk/client-apigatewaymanagementapi');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async event => {
  // API Gateway Management APIは動的に作成（エンドポイントが必要）
  const apigatewaymanagementapi = new ApiGatewayManagementApiClient({
    endpoint: process.env.WEBSOCKET_API_ENDPOINT
  });
  const connectionsTable = process.env.CONNECTIONS_TABLE;

  try {
    // 投票更新イベントを受信（他のLambdaやAPIから呼び出される）
    const { eventId, votes } = JSON.parse(event.body || '{}');

    if (!eventId || !votes) {
      return {
        statusCode: 400,
        body: 'Missing eventId or votes data'
      };
    }

    // すべての接続を取得
    const connections = await dynamodb.send(
      new ScanCommand({
        TableName: connectionsTable
      })
    );

    // 各接続にメッセージを送信
    const postData = JSON.stringify({
      type: 'voteUpdate',
      eventId,
      votes,
      timestamp: new Date().toISOString()
    });

    const postCalls = connections.Items.map(async({ connectionId }) => {
      try {
        await apigatewaymanagementapi.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: postData
          })
        );
      } catch (error) {
        if (error.statusCode === 410) {
          // 接続が切断されている場合は削除
          console.log(`Deleting stale connection: ${connectionId}`);
          await dynamodb.send(
            new DeleteCommand({
              TableName: connectionsTable,
              Key: { connectionId }
            })
          );
        } else {
          console.error(`Failed to send to ${connectionId}:`, error);
        }
      }
    });

    await Promise.all(postCalls);

    return {
      statusCode: 200,
      body: `Broadcast sent to ${connections.Items.length} connections`
    };
  } catch (error) {
    console.error('Broadcast error:', error);
    return {
      statusCode: 500,
      body: 'Failed to broadcast'
    };
  }
};
