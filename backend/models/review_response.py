from pydantic import BaseModel
from typing import List
from models.issue import Issue

class ReviewResponse(BaseModel):
    findings: List[Issue]
    summary: str
    overall_severity: str
    language: str