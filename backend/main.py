from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.routes_review import router as review_router
from app.api.routes_ws import router as ws_router

load_dotenv()

app = FastAPI(title="AI Code Reviewer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router, prefix="/api/review", tags=["review"])
app.include_router(ws_router, tags=["websocket"])

@app.get("/health")
async def health():
    return {"status": "ok"}