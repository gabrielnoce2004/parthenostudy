const WebSocket = require('ws');
const db = require('./db');
const chatHandler = require('./chathandler');

async function initWebSocketServer() {
  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws) => {
    console.log('A client connected.');

    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        const { type, chatName, username, text } = parsedMessage;

        console.log(`Received message: type=${type}, chatName=${chatName}, username=${username}, text=${text}`);

        if (!chatName || !username) {
          throw new Error('Missing required fields: chatName or username.');
        }

        switch (type) {
          case 'sendMessage':
            if (!text) {
              throw new Error('Message text is missing.');
            }

            await db.saveMessageToDb(chatName, username, text);

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: 'newMessage',
                    chatName: chatName,
                    username: username,
                    message: text,
                    timestamp: new Date().toISOString(),
                  })
                );
              }
            });
            break;

          case 'loadChatHistory':
            const chatHistory = await db.getMessages(username, chatName);
            ws.send(
              JSON.stringify({
                type: 'chatHistory',
                chatName: chatName,
                chatHistory: chatHistory,
              })
            );
            break;

          default:
            console.error('Unknown message type:', type);
        }
      } catch (err) {
        console.error('Error processing message:', err.message);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: err.message,
          })
        );
      }
    });

    ws.on('close', () => {
      console.log('A client disconnected.');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server listening on port 8080.');
}

module.exports = {
  initWebSocketServer,
};
