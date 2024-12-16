const db = require('./db');
const websocketServer = require('./ws');

db.createTables();

websocketServer.initWebSocketServer();
