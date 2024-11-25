import asyncio
import websockets
import json

connected_clients = {}  # username -> websocket
messages = {}  # username -> [messages]


async def handler(websocket, path=""):  # Aggiunto un valore di default per 'path'
    await websocket.send(json.dumps({"type": "request_username"}))
    username = await websocket.recv()
    await register_user(websocket, username)


async def register_user(websocket, username):
    """Registra un nuovo utente e gestisce la chat"""
    connected_clients[username] = websocket

    # Invia messaggi non letti
    if username in messages:
        for msg in messages[username]:
            await websocket.send(json.dumps({"type": "message", "from": msg["from"], "message": msg["message"]}))
        del messages[username]

    try:
        async for data in websocket:
            message = json.loads(data)
            to_user = message.get("to")
            content = message.get("message")

            if to_user in connected_clients:
                # Invia il messaggio in tempo reale
                await connected_clients[to_user].send(json.dumps({"type": "message", "from": username, "message": content}))
            else:
                # Salva il messaggio se l'utente non è online
                if to_user not in messages:
                    messages[to_user] = []
                messages[to_user].append({"from": username, "message": content})
    except:
        print(f"{username} si è disconnesso.")
    finally:
        # Rimuovi il client alla disconnessione
        connected_clients.pop(username, None)


async def main():
    async with websockets.serve(handler, "127.0.0.1", 3001):
        print("WebSocket Server in esecuzione su ws://127.0.0.1:3001")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
