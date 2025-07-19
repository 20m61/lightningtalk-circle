const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async event => {
  const { connectionId } = event.requestContext;
  const connectionsTable = process.env.CONNECTIONS_TABLE;

  try {
    // 接続情報を保存
    await dynamodb.send(
      new PutCommand({
        TableName: connectionsTable,
        Item: {
          connectionId,
          connectedAt: new Date().toISOString()
        }
      })
    );

    console.log(`WebSocket connected: ${connectionId}`);

    return {
      statusCode: 200,
      body: 'Connected'
    };
  } catch (error) {
    console.error('Connection error:', error);
    return {
      statusCode: 500,
      body: 'Failed to connect'
    };
  }
};
