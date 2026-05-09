from fastapi import APIRouter, HTTPException
from models.review_request import ReviewRequest
from models.review_response import ReviewResponse
from services.reviewer import run_review

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
async def review_code(request: ReviewRequest):
    try:
        result = run_review(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))