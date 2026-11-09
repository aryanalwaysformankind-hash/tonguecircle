import json
import logging
import os
from collections.abc import AsyncIterator

import httpx
from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import StreamingResponse

from clerk_auth import require_user
from models.social import TranslateRequest

router = APIRouter()
logger = logging.getLogger(__name__)
OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"


def _translation_error(status_code: int, response_text: str = "") -> HTTPException:
    lowered = response_text.lower()
    if status_code in (401, 403) or "invalid api key" in lowered:
        return HTTPException(status_code=503, detail="Translation service credentials need attention")
    if status_code == 402 or "insufficient_quota" in lowered or "out of credits" in lowered:
        return HTTPException(status_code=402, detail="Translation is temporarily out of credits")
    if status_code == 429 or "rate limit" in lowered:
        return HTTPException(status_code=429, detail="Translation is busy; try again shortly")
    if status_code >= 500:
        return HTTPException(status_code=503, detail="Translation service is temporarily unavailable")
    return HTTPException(status_code=502, detail="Translation could not be completed")


@router.post("/translate")
async def translate_text(
    body: TranslateRequest,
    user: dict = Depends(require_user),
) -> StreamingResponse:
    del user  # Authentication is required; translation requests contain no account-specific data.
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="Translation is not configured. Add OPENAI_API_KEY to the backend environment.")

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    payload = {
        "model": model,
        "stream": True,
        "max_tokens": 900,
        "messages": [
            {
                "role": "system",
                "content": "You are a precise translator. Translate only the provided text. Preserve meaning, tone, names, and formatting. Return no explanation or quotation marks.",
            },
            {
                "role": "user",
                "content": f"Translate the following text into {body.target_language}. Return only the translation.\n\n{body.text}",
            },
        ],
    }

    async def stream() -> AsyncIterator[str]:
        timeout = httpx.Timeout(75.0, connect=10.0)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream(
                    "POST",
                    OPENAI_CHAT_COMPLETIONS_URL,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json=payload,
                ) as response:
                    if response.status_code >= 400:
                        response_text = (await response.aread()).decode("utf-8", errors="replace")
                        error = _translation_error(response.status_code, response_text)
                        logger.warning("Translation provider returned HTTP %s", response.status_code)
                        yield f"event: error\ndata: {json.dumps({'status': error.status_code, 'detail': error.detail})}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        data = line[5:].strip()
                        if data == "[DONE]":
                            break
                        try:
                            event = json.loads(data)
                            content = event.get("choices", [{}])[0].get("delta", {}).get("content")
                        except (json.JSONDecodeError, IndexError, AttributeError, TypeError):
                            continue
                        if isinstance(content, str) and content:
                            yield f"data: {json.dumps({'text': content}, ensure_ascii=False)}\n\n"
        except httpx.TimeoutException:
            logger.warning("Translation provider timed out")
            error = HTTPException(status_code=504, detail="Translation took too long. Please try again.")
            yield f"event: error\ndata: {json.dumps({'status': error.status_code, 'detail': error.detail})}\n\n"
        except httpx.RequestError:
            logger.exception("Could not connect to translation provider")
            error = HTTPException(status_code=503, detail="Translation service is temporarily unavailable")
            yield f"event: error\ndata: {json.dumps({'status': error.status_code, 'detail': error.detail})}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
