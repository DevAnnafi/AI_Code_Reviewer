from pydantic import BaseModel
from typing import Optional

class ReviewRequest(BaseModel):
    code: str
    language: str          # "python", "javascript", etc.
    context: Optional[str] = None   # e.g. "auth module", "payment handler"
    filename: Optional[str] = None

class Finding(BaseModel):
    line: Optional[int]
    severity: str          # "critical", "high", "medium", "low", "info"
    category: str          # "injection", "auth", "secrets", etc.
    message: str
    suggestion: str