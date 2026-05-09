import json
from integrations.claude_client import stream_review
from services.prompt_builder import build_prompt, SYSTEM_PROMPT
from models.review_request import ReviewRequest
from models.review_response import ReviewResponse
from models.issue import Issue

def run_review(request: ReviewRequest) -> ReviewResponse:
    prompt = build_prompt(request)
    
    raw = ""
    for chunk in stream_review(prompt, SYSTEM_PROMPT):
        raw += chunk

    # strip markdown code fences if Claude adds them
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]  # remove first line (```json)
    if raw.endswith("```"):
        raw = raw.rsplit("\n", 1)[0]  # remove last line (```)
    raw = raw.strip()

    data = json.loads(raw)

    findings = [Issue(**f) for f in data.get("findings", [])]

    return ReviewResponse(
        findings=findings,
        summary=data.get("summary", ""),
        overall_severity=data.get("overall_severity", "info"),
        language=request.language
    )