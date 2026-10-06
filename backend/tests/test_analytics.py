import pytest
from httpx import AsyncClient, ASGITransport

try:
    from backend.app.main import app
except ModuleNotFoundError:
    from app.main import app


@pytest.mark.asyncio
async def test_analytics_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/admin/analytics")
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_analytics_forbidden_for_student():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "student@example.edu", "password": "demo-password"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        res = await client.get(
            "/api/v1/admin/analytics",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403


@pytest.mark.asyncio
async def test_analytics_success_for_admin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.edu", "password": "demo-password"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        res = await client.get(
            "/api/v1/admin/analytics",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "resolution_metrics" in data
        assert data["resolution_metrics"]["macro_routing_accuracy"] == 0.884
        assert data["resolution_metrics"]["autonomous_resolution_rate"] == 0.76
        assert "department_volume" in data
        assert data["department_volume"]["it"] > 0
        assert "latency_metrics" in data
        assert data["latency_metrics"]["p50_latency_ms"] > 0
        assert len(data["recent_events"]) >= 3
