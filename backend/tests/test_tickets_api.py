"""Tests for user-scoped escalation tickets API and admin triage."""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def get_token_for(client: AsyncClient, email: str = "student@example.edu") -> str:
    res = await client.post("/api/v1/auth/login", json={"email": email, "password": "demo-password"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.anyio
async def test_ticket_isolation_between_students(client: AsyncClient):
    """Verify that student A only sees their own tickets, not tickets created by student B."""
    # Register/login student 1
    s1_email = f"student1_{uuid.uuid4().hex[:6]}@example.edu"
    reg1 = await client.post(
        "/api/v1/auth/register",
        json={"email": s1_email, "password": "demo-password-123", "display_name": "Student One"},
    )
    assert reg1.status_code == 201
    tok1 = (await client.post("/api/v1/auth/login", json={"email": s1_email, "password": "demo-password-123"})).json()["access_token"]

    # Register/login student 2
    s2_email = f"student2_{uuid.uuid4().hex[:6]}@example.edu"
    reg2 = await client.post(
        "/api/v1/auth/register",
        json={"email": s2_email, "password": "demo-password-123", "display_name": "Student Two"},
    )
    assert reg2.status_code == 201
    tok2 = (await client.post("/api/v1/auth/login", json={"email": s2_email, "password": "demo-password-123"})).json()["access_token"]

    # Student 1 creates a ticket
    t1_id = f"TKT-S1-{uuid.uuid4().hex[:4].upper()}"
    create_res1 = await client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {tok1}"},
        json={
            "ticketId": t1_id,
            "department": "IT Support",
            "reason": "Hostel WiFi connectivity failure in Block C",
            "urgency": "high",
        },
    )
    assert create_res1.status_code == 201
    created1 = create_res1.json()
    assert created1["ticketId"] == t1_id
    assert created1["studentEmail"] == s1_email

    # Student 1 lists tickets: should see t1
    list_s1 = await client.get("/api/v1/tickets", headers={"Authorization": f"Bearer {tok1}"})
    assert list_s1.status_code == 200
    s1_tickets = list_s1.json()
    assert any(t["ticketId"] == t1_id for t in s1_tickets)

    # Student 2 lists tickets: should NOT see t1
    list_s2 = await client.get("/api/v1/tickets", headers={"Authorization": f"Bearer {tok2}"})
    assert list_s2.status_code == 200
    s2_tickets = list_s2.json()
    assert not any(t["ticketId"] == t1_id for t in s2_tickets)

    # Admin lists tickets: SHOULD see t1
    tok_admin = await get_token_for(client, "admin@example.edu")
    list_admin = await client.get("/api/v1/tickets", headers={"Authorization": f"Bearer {tok_admin}"})
    assert list_admin.status_code == 200
    admin_tickets = list_admin.json()
    assert any(t["ticketId"] == t1_id for t in admin_tickets)

    # Admin resolves ticket
    patch_res = await client.patch(
        f"/api/v1/tickets/{t1_id}",
        headers={"Authorization": f"Bearer {tok_admin}"},
        json={
            "status": "resolved",
            "resolutionNote": "Access point rebooted by Network Operations.",
            "assignedTo": "Network Ops",
        },
    )
    assert patch_res.status_code == 200
    patched = patch_res.json()
    assert patched["status"] == "resolved"
    assert patched["resolutionNote"] == "Access point rebooted by Network Operations."

    # Student 1 sees resolved status
    list_s1_after = await client.get("/api/v1/tickets", headers={"Authorization": f"Bearer {tok1}"})
    updated_t1 = next(t for t in list_s1_after.json() if t["ticketId"] == t1_id)
    assert updated_t1["status"] == "resolved"
    assert updated_t1["resolutionNote"] == "Access point rebooted by Network Operations."
