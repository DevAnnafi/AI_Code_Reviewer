from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import review
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Code Reviewer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review.router, prefix="/api/review", tags=["review"]) 