from models.review_request import ReviewRequest

SYSTEM_PROMPT = """You are an expert security-focused code reviewer with deep knowledge of:
- OWASP Top 10 vulnerabilities
- Common injection attacks (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets and credentials exposure
- Insecure dependencies and configurations

When reviewing code you must respond in this exact JSON format:
{
    "findings": [
        {
            "line": <line number or null>,
            "severity": "<critical|high|medium|low|info>",
            "category": "<injection|auth|secrets|xss|csrf|config|misc>",
            "message": "<clear description of the issue>",
            "suggestion": "<concrete fix suggestion>"
        }
    ],
    "summary": "<2-3 sentence overall summary>",
    "overall_severity": "<critical|high|medium|low|info>"
}

Return ONLY the JSON. No markdown, no explanation, no preamble."""

def build_prompt(request: ReviewRequest) -> str:
    parts = []

    if request.filename:
        parts.append(f"Filename: {request.filename}")

    if request.context:
        parts.append(f"Context: {request.context}")

    parts.append(f"Language: {request.language}")
    parts.append(f"\nCode to review:\n```{request.language}\n{request.code}\n```")

    return "\n".join(parts)