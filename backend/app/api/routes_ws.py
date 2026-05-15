from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.prompt_builder import build_prompt, SYSTEM_PROMPT
from integrations.claude_client import stream_review
from models.review_request import ReviewRequest
import json

router = APIRouter()

@router.websocket("/ws/review")
async def websocket_review(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        request = ReviewRequest(**data)
        prompt = build_prompt(request)

        raw = ""
        for chunk in stream_review(prompt, SYSTEM_PROMPT):
            raw += chunk
            await websocket.send_json({
                "type": "chunk",
                "content": chunk
            })

        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw.rsplit("\n", 1)[0]
        raw = raw.strip()

        data = json.loads(raw)
        await websocket.send_json({
            "type": "done",
            "result": data
        })

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "detail": str(e)
        })
    finally:
        await websocket.close()