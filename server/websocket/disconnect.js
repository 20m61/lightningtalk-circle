const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async event => {
  const connectionId = event.requestContext.connectionId;
  const connectionsTable = process.env.CONNECTIONS_TABLE;

  try {
    // 接続情報を削除
    await dynamodb
      .delete({
        TableName: connectionsTable,
        Key: { connectionId }
      })
      .promise();

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
