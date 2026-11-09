import asyncio

import pytest
from fastapi import HTTPException

from models.social import TranslateRequest
from routers.translation import _translation_error, translate_text


@pytest.mark.parametrize(
    ("provider_status", "expected_status"),
    [(400, 502), (401, 503), (402, 402), (429, 429), (500, 503)],
)
def test_translation_provider_errors_are_sanitized(provider_status, expected_status):
    error = _translation_error(provider_status, "provider response")
    assert error.status_code == expected_status


def test_translation_requires_backend_openai_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    request = TranslateRequest(text="Hello", target_language="French")
    with pytest.raises(HTTPException) as raised:
        asyncio.run(translate_text(request, {"user_id": "user_test"}))
    assert raised.value.status_code == 503
