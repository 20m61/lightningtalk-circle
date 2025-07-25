const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async event => {
  const { connectionId } = event.requestContext;

  try {
    const body = JSON.parse(event.body);
    console.log(`Message from ${connectionId}:`, body);

    // メッセージタイプに応じて処理
    switch (body.type) {
    case 'ping':
      // キープアライブ
      return {
        statusCode: 200,
        body: JSON.stringify({ type: 'pong' })
      };

    case 'subscribe':
      // イベント購読（将来の拡張用）
      console.log(`Connection ${connectionId} subscribed to event ${body.eventId}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ type: 'subscribed', eventId: body.eventId })
      };

    default:
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unknown message type' })
      };
    }
  } catch (error) {
    console.error('Message handling error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process message' })
    };
  }
};
