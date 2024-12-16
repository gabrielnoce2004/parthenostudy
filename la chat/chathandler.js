const db = require('./db');

async function saveMessageAndBroadcast(wss, chatName, username, text) {
  try {
      const chatId = await db.getIdFromName(username, chatName);
      console.log(username, chatName, chatId)
      if (!chatId) {
          throw new Error('Chat ID is null or undefined');
      }

      await db.saveMessageToDb(chatName, username, text);

      if (wss.clientsMap.has(chatName)) {
          const clients = wss.clientsMap;
          clients.forEach(client => {
              client.send(JSON.stringify({
                  type: 'newMessage',
                  chatName: chatName,
                  username: username,
                  message: text,
                  timestamp: new Date().toLocaleTimeString()
              }));
          });
      }
  } catch (err) {
      console.error('Error saving and broadcasting message:', err);
  }
}


async function loadChatHistory(ws, chatName, username) {
  try {
      const chatId = await db.getIdFromName(username, chatName);
      if (!chatId) {
          throw new Error(`Chat '${chatName}' non trovata.`);
      }

      const messages = await db.getMessages(username, chatName);
      console.log(messages)
      ws.send(JSON.stringify({
          type: 'chatHistory',
          chatName: chatName,
          chatHistory: messages
      }));
  } catch (err) {
      console.error('Error loading chat history:', err.message);
      ws.send(JSON.stringify({
          type: 'error',
          message: err.message
      }));
  }
}


async function addParticipant(wss, chatName, username) {
  let chatId = await db.getIdFromName(chatName);
  if (!chatId) {
    const newChat = await db.createChat(chatName);
    chatId = newChat.chatId;
  }

  db.saveParticipantToDb(chatName, username);

  if (!wss.clientsMap.has(chatName)) {
    wss.clientsMap.set(chatName, new Set());
  }
  wss.clientsMap.get(chatName).add(username);
}

module.exports = {
  saveMessageAndBroadcast,
  loadChatHistory,
  addParticipant
};
