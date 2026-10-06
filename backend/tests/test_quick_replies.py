import pytest
from httpx import AsyncClient, ASGITransport

try:
    from backend.app.main import app
except ModuleNotFoundError:
    from app.main import app


@pytest.mark.asyncio
async def test_quick_replies_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/chat/quick-replies", json={"issue_summary": "WiFi not working"})
        assert res.status_code in {401, 403}


@pytest.mark.asyncio
async def test_quick_replies_ticket_resolution():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.edu", "password": "demo-password"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        res = await client.post(
            "/api/v1/chat/quick-replies",
            json={
                "department": "IT",
                "issue_summary": "Eduroam Wi-Fi authentication certificate expired on student laptop",
                "target": "ticket_resolution",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "templates" in data
        assert len(data["templates"]) >= 3
        # Ensure templates contain reasonable resolution text
        assert any("credential" in t.lower() or "certificate" in t.lower() or "network" in t.lower() or "access" in t.lower() for t in data["templates"])


@pytest.mark.asyncio
async def test_quick_replies_chat_followup():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@example.edu", "password": "demo-password"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        res = await client.post(
            "/api/v1/chat/quick-replies",
            json={
                "department": "Fees",
                "issue_summary": "Hostel fee payment deadline and late payment waiver",
                "target": "chat_followup",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "templates" in data
        assert len(data["templates"]) >= 3
