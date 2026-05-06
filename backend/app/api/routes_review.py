from fastapi import APIRouter
from models.review_request import ReviewRequest
from models.review_response import ReviewResponse
from models.issue import Issue

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
async def review_code(request: ReviewRequest):
    dummy = Issue(
        line=1,
        severity="high",
        category="injection",
        message="Potential SQL injection",
        suggestion="Use parameterized queries"
    )
    return ReviewResponse(
        findings=[dummy],
        summary="1 issue found",
        overall_severity="high",
        language=request.language
    )