const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chats.db');

const chatIdCache = new Map();
const participantsCache = new Map();
const messagesCache = new Map();

function createTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      username TEXT,
      FOREIGN KEY(chat_id) REFERENCES chats(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      username TEXT,
      message TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id)
    )`);

    db.run('CREATE INDEX IF NOT EXISTS idx_chat_name ON chats(name)');
    db.run('CREATE INDEX IF NOT EXISTS idx_participants_chat_id ON participants(chat_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)');
  });
}

let i = 0;
async function getIdFromName(user1, user2) {
  i++;
  console.log("getIdFromName called with:", user1, user2);
  
  if (!user1 || !user2) {
    console.error('Usernames cannot be undefined');
    return null;
  }

  const chatName1 = `${user1}_${user2}`;
  const chatName2 = `${user2}_${user1}`;

  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM chats WHERE name = ?', [chatName1], (err, chat) => {
      if (err || !chat) {
        db.get('SELECT id FROM chats WHERE name = ?', [chatName2], (err, chat) => {
          if (err || !chat) {
            console.log(`Chat '${chatName1}' e '${chatName2}' non trovate, creando una nuova chat...`);
            createChat(user1, user2).then((newChatId) => resolve(newChatId));
          } else {
            console.log(`Chat trovata: ${chatName2}`);
            resolve(chat.id);
          }
        });
      } else {
        console.log(`Chat trovata: ${chatName1}`);
        resolve(chat.id);
      }
    });
  });
}



async function createChat(user1, user2) {
  if (!user1 || !user2) {
    console.log("si fra la sto creando?")
    console.error('Usernames cannot be undefined');
    return null;
  }

  const chatName = `${user1}_${user2}`;
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO chats (name) VALUES (?)', [chatName], function (err) {
      if (err) {
        console.error('Error creating chat:', err);
        return reject(err);
      }
      console.log(`Created chat '${chatName}' with ID: ${this.lastID}`);
      resolve(this.lastID); // Restituisci l'ID della chat appena creata
    });
  });
}


async function getMessages(username, target, limit = 999, offset = 0) {
  const chatId = await getIdFromName(username, target);
  if (!chatId) {
    console.error('Chat id is undefined');
    return null;
  }

  return new Promise((resolve, reject) => {
    db.all(
      'SELECT username, message, timestamp FROM messages WHERE chat_id = ? ORDER BY timestamp ASC LIMIT ? OFFSET ?',
      [chatId, limit, offset],
      (err, rows) => {
        if (err) {
          console.error('Error retrieving messages:', err);
          return reject(err);
        }
        resolve(rows);
      }
    );
  });
}

async function saveMessageToDb(chatName, username, message) {
  console.log(`saveMessageToDb called with: ${chatName}, ${username}, ${message}`);
  if (!chatName || !username || !message) {
    console.error('Missing parameters for saving message');
    return;
  }

  try {
    const chatId = await getIdFromName(username, chatName);
    
    if (!chatId) {
      console.error('Chat does not exist, cannot save message');
      return;
    }

    db.run('INSERT INTO messages (chat_id, username, message) VALUES (?, ?, ?)', [chatId, username, message], (err) => {
      if (err) {
        console.error('Error saving message to the database:', err);
      } else {
        messagesCache.delete(chatId);
      }
    });
  } catch (err) {
    console.error('Error saving message:', err);
  }
}


function saveParticipantToDb(chatName, username) {
  if (!chatName || !username) {
    console.error('Missing parameters for saving participant');
    return;
  }

  getIdFromName(chatName).then(chatId => {
    if (!chatId) {
      console.error('Chat does not exist, cannot save participant');
      return;
    }

    db.run('INSERT INTO participants (chat_id, username) VALUES (?, ?)', [chatId, username], (err) => {
      if (err) {
        console.error('Error saving participant to the database:', err);
      }
    });
  }).catch(err => console.error('Error getting chat ID:', err));
}

module.exports = {
  createTables,
  getIdFromName,
  createChat,
  getMessages,
  saveMessageToDb,
  saveParticipantToDb
};
