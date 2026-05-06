from pydantic import BaseModel
from typing import Optional

class ReviewRequest(BaseModel):
    code: str
    language: str
    filename: Optional[str] = None
    context: Optional[str] = None