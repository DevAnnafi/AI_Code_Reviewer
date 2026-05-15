import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:8000/ws/review"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "code": "def get_user(user_id):\n    query = f'SELECT * FROM users WHERE id = {user_id}'\n    return db.execute(query)",
            "language": "python",
            "filename": "db.py"
        }))

        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            if data["type"] == "chunk":
                print(data["content"], end="", flush=True)
            elif data["type"] == "done":
                print("\n\n--- FINAL RESULT ---")
                print(json.dumps(data["result"], indent=2))
                break
            elif data["type"] == "error":
                print(f"ERROR: {data['detail']}")
                break

asyncio.run(test())