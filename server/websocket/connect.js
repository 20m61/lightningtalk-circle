const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async event => {
  const { connectionId } = event.requestContext;
  const connectionsTable = process.env.CONNECTIONS_TABLE;

  try {
    // 接続情報を保存
    await dynamodb
      .put({
        TableName: connectionsTable,
        Item: {
          connectionId,
          connectedAt: new Date().toISOString()
        }
      })
      .promise();

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
