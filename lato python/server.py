import asyncio
import websockets
import json
import os
import sqlite3

# Use SQLite for persistent message storage
class MessageDatabase:
    def __init__(self, db_path='chat_messages.db'):
        self.conn = sqlite3.connect(db_path)
        self.create_tables()

    def create_tables(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender TEXT,
                receiver TEXT,
                message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_read INTEGER DEFAULT 0
            )
        ''')
        self.conn.commit()

    def save_message(self, sender, receiver, message):
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO messages (sender, receiver, message) 
            VALUES (?, ?, ?)
        ''', (sender, receiver, message))
        self.conn.commit()

    def get_unread_messages(self, username):
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT sender, message FROM messages 
            WHERE receiver = ? AND is_read = 0
            ORDER BY timestamp
        ''', (username,))
        messages = cursor.fetchall()
        
        # Mark messages as read
        cursor.execute('''
            UPDATE messages SET is_read = 1 
            WHERE receiver = ? AND is_read = 0
        ''', (username,))
        self.conn.commit()
        
        return messages

    def close(self):
        self.conn.close()

# Global variables
connected_clients = {}
message_db = MessageDatabase()

async def handler(websocket, path=None):
    username = None  # Initialize username variable before try block
    try:
        # Request username
        await websocket.send(json.dumps({"type": "request_username"}))
        username = await websocket.recv()
        print(f"Received username: {username}")  # Add verbose logging
        
        # Register user
        connected_clients[username] = websocket
        print(f"{username} connected")

        # Send unread messages
        unread_messages = message_db.get_unread_messages(username)
        print(f"Unread messages for {username}: {unread_messages}")  # Log unread messages
        for sender, message in unread_messages:
            await websocket.send(json.dumps({
                "type": "message", 
                "from": sender, 
                "message": message
            }))

        # Message handling loop
        async for message_str in websocket:
            try:
                print(f"Received message: {message_str}")  # Log received messages
                message = json.loads(message_str)
                to_user = message.get("to")
                content = message.get("message")

                print(f"Sending message from {username} to {to_user}: {content}")  # Log message details

                # Save message to database
                message_db.save_message(username, to_user, content)

                # Try to send in real-time
                if to_user in connected_clients:
                    await connected_clients[to_user].send(json.dumps({
                        "type": "message", 
                        "from": username, 
                        "message": content
                    }))
                else:
                    print(f"Recipient {to_user} not connected")  # Log when recipient is not connected
            except json.JSONDecodeError:
                print(f"Invalid JSON from {username}: {message_str}")
            except Exception as e:
                print(f"Error processing message: {e}")
                e.print_exc()  # Print full traceback

    except websockets.exceptions.ConnectionClosed:
        print(f"{username} disconnected")
    except Exception as e:
        print(f"Unexpected error with {username}: {e}")
        e.print_exc()
    finally:
        # Remove from connected clients
        if username and username in connected_clients:
            connected_clients.pop(username, None)
            print(f"Removed {username} from connected clients")

async def main():
    server = await websockets.serve(handler, "127.0.0.1", 3001)
    print("WebSocket Server running on ws://127.0.0.1:3001")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())