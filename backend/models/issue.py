from pydantic import BaseModel
from typing import Optional

class Issue(BaseModel):
    line: Optional[int] = None
    severity: str        # "critical", "high", "medium", "low", "info"
    category: str        # "injection", "secrets", "auth", "xss", "misc"
    message: str
    suggestion: str