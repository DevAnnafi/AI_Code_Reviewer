from pydantic import BaseModel
from typing import Optional

class ReviewRequest(BaseModel):
    code: Optional[str] = None
    language: str
    filename: Optional[str] = None
    context: Optional[str] = None