from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from models.review_request import ReviewRequest
from models.review_response import ReviewResponse
from models.issue import Issue
from services.reviewer import run_review
from utils.file_utils import detect_language, validate_file

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
async def review_code(request: ReviewRequest):
    try:
        result = run_review(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/upload", response_model=ReviewResponse)
async def review_file(
    file: UploadFile = File(...),
    context: Optional[str] = Form(None)
):
    contents = await file.read()

    error = validate_file(file.filename, len(contents))
    if error:
        raise HTTPException(status_code=400, detail=error)

    code = contents.decode("utf-8")
    language = detect_language(file.filename)

    request = ReviewRequest(
        code=code,
        language=language,
        filename=file.filename,
        context=context
    )

    try:
        result = run_review(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
