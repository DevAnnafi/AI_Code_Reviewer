import anthropic
from core.config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

def stream_review(prompt: str, system_prompt: str):
    with client.messages.stream(
        model="claude-sonnet-4-5",
        max_tokens=settings.max_tokens,
        system=system_prompt,
        messages=[
            {"role": "user", "content": prompt}
        ]
    ) as stream:
        for text in stream.text_stream:
            yield text