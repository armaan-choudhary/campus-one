"""Tests for persistent student conversation history and directory CRUD."""
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
async def test_student_conversation_lifecycle(client: AsyncClient):
    token = await get_token_for(client, "student@example.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a conversation
    conv_id = f"conv-test-{uuid.uuid4().hex[:8]}"
    create_res = await client.post(
        "/api/v1/chat/conversations",
        headers=headers,
        json={"id": conv_id, "title": "Hostel Wi-Fi Inquiry", "domain_key": "it"},
    )
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["id"] == conv_id
    assert created["title"] == "Hostel Wi-Fi Inquiry"
    assert created["domain_key"] == "it"
    assert created["pinned"] is False

    # 2. List conversations and verify presence
    list_res = await client.get("/api/v1/chat/conversations", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(c["id"] == conv_id for c in items)

    # 3. Patch conversation (pin and update title)
    patch_res = await client.patch(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=headers,
        json={"title": "Updated Wi-Fi Issue", "pinned": True},
    )
    assert patch_res.status_code == 200
    patched = patch_res.json()
    assert patched["title"] == "Updated Wi-Fi Issue"
    assert patched["pinned"] is True

    # 4. Check history endpoint returns conversation metadata
    hist_res = await client.get(
        f"/api/v1/chat/history?conversation_id={conv_id}",
        headers=headers,
    )
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert hist["conversation"] is not None
    assert hist["conversation"]["id"] == conv_id
    assert hist["conversation"]["title"] == "Updated Wi-Fi Issue"

    # 5. Delete conversation
    del_res = await client.delete(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

    # 6. Verify conversation is no longer in list
    list_res_after = await client.get("/api/v1/chat/conversations", headers=headers)
    assert not any(c["id"] == conv_id for c in list_res_after.json())


@pytest.mark.anyio
async def test_conversation_idor_isolation(client: AsyncClient):
    """Verify Student B cannot modify or delete Student A's conversation, and unauthorized roles receive 403."""
    token_a = await get_token_for(client, "student@example.edu")

    # Register second student with valid conversations:own permission
    email_b = f"student.b.{uuid.uuid4().hex[:6]}@example.edu"
    reg_b = await client.post(
        "/api/v1/auth/register",
        json={"email": email_b, "password": "password-12345", "display_name": "Student B"},
    )
    assert reg_b.status_code == 201
    token_b = reg_b.json()["access_token"]

    # Agent role without conversations:own
    token_agent = await get_token_for(client, "agent@example.edu")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}
    headers_agent = {"Authorization": f"Bearer {token_agent}"}

    conv_id = f"conv-private-{uuid.uuid4().hex[:8]}"
    create_res = await client.post(
        "/api/v1/chat/conversations",
        headers=headers_a,
        json={"id": conv_id, "title": "Confidential Student Data"},
    )
    assert create_res.status_code == 201

    # Student B has conversations:own but does not own conv_id -> 404 Not Found
    patch_attempt = await client.patch(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=headers_b,
        json={"title": "Tampered Title"},
    )
    assert patch_attempt.status_code == 404

    delete_attempt = await client.delete(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=headers_b,
    )
    assert delete_attempt.status_code == 404

    # Student B attempts to overwrite Student A's conversation via POST -> 409 Conflict
    collision_attempt = await client.post(
        "/api/v1/chat/conversations",
        headers=headers_b,
        json={"id": conv_id, "title": "Overwritten by B"},
    )
    assert collision_attempt.status_code == 409

    # Agent role lacks conversations:own -> 403 Forbidden
    agent_attempt = await client.patch(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=headers_agent,
        json={"title": "Agent Tamper"},
    )
    assert agent_attempt.status_code == 403

    # Cleanup by Student A
    await client.delete(f"/api/v1/chat/conversations/{conv_id}", headers=headers_a)
