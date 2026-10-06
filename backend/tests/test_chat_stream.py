import pytest
from httpx import AsyncClient, ASGITransport

try:
    from backend.app.main import app
    from backend.app.auth.provider import get_auth_provider
except ModuleNotFoundError:
    from app.main import app
    from app.auth.provider import get_auth_provider


@pytest.mark.asyncio
async def test_chat_stream_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/chat/stream", json={"message": "hello"})
        assert res.status_code in {401, 403}


@pytest.mark.asyncio
async def test_chat_stream_delivers_sse_events():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@example.edu", "password": "demo-password"},
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]

        res = await client.post(
            "/api/v1/chat/stream",
            json={"message": "How do I reset my Wi-Fi password?"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        assert "text/event-stream" in res.headers.get("content-type", "")

        body = res.text
        assert "event: stage" in body
        assert "event: done" in body
        assert "detected_domains" in body
