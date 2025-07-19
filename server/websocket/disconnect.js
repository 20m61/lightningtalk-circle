const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async event => {
  const { connectionId } = event.requestContext;
  const connectionsTable = process.env.CONNECTIONS_TABLE;

  try {
    // 接続情報を削除
    await dynamodb.send(
      new DeleteCommand({
        TableName: connectionsTable,
        Key: { connectionId }
      })
    );

    console.log(`WebSocket disconnected: ${connectionId}`);

    return {
      statusCode: 200,
      body: 'Disconnected'
    };
  } catch (error) {
    console.error('Disconnection error:', error);
    return {
      statusCode: 500,
      body: 'Failed to disconnect'
    };
  }
};
