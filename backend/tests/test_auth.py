"""Comprehensive tests for Authentication, JWT lifecycle, and RBAC matrix."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import Settings


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.anyio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["auth_provider"] == "mock"


@pytest.mark.anyio
@pytest.mark.parametrize(
    "email,role,expected_name",
    [
        ("student@example.edu", "student", "Alex Rivera"),
        ("agent@example.edu", "support_agent", "Sarah Jenkins"),
        ("admin.knowledge@example.edu", "knowledge_admin", "Dr. Patricia Cole"),
        ("executive@example.edu", "analyst", "Dr. Marcus Vance"),
        ("admin@example.edu", "admin", "System Administrator"),
    ],
)
async def test_login_seeded_accounts_success(client: AsyncClient, email: str, role: str, expected_name: str):
    """Test successful authentication for all seeded persona accounts."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "demo-password"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 3600

    user = data["user"]
    assert user["email"] == email
    assert user["role"] == role
    assert user["display_name"] == expected_name


@pytest.mark.anyio
async def test_login_invalid_password(client: AsyncClient):
    """Test login rejection with invalid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.edu", "password": "wrong-password"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"] == "invalid_credentials"


@pytest.mark.anyio
async def test_login_unknown_user(client: AsyncClient):
    """Test login rejection with non-existent user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@example.edu", "password": "demo-password"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"] == "invalid_credentials"


@pytest.mark.anyio
async def test_get_me_success_and_unauthorized(client: AsyncClient):
    """Test /auth/me with valid and invalid tokens."""
    # 1. Login to get token
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.edu", "password": "demo-password"},
    )
    token = login_resp.json()["access_token"]

    # 2. Access /auth/me with token
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "student@example.edu"
    assert me_data["role"] == "student"
    assert "conversations:own" in me_data["permissions"]

    # 3. Access without token
    unauth_resp = await client.get("/api/v1/auth/me")
    assert unauth_resp.status_code == 401

    # 4. Access with bogus token
    bogus_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.fake.token"},
    )
    assert bogus_resp.status_code == 401


@pytest.mark.anyio
async def test_refresh_token_lifecycle(client: AsyncClient):
    """Test refresh token rotation and revocation on logout."""
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@example.edu", "password": "demo-password"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    # Refresh successfully
    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    new_tokens = refresh_resp.json()
    assert "access_token" in new_tokens
    new_refresh_token = new_tokens["refresh_token"]

    # Old refresh token should no longer work (rotated)
    old_retry_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert old_retry_resp.status_code == 401

    # Logout with new refresh token
    logout_resp = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": new_refresh_token},
    )
    assert logout_resp.status_code == 200
    assert logout_resp.json()["status"] == "success"

    # Revoked token cannot be used again
    revoked_retry_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": new_refresh_token},
    )
    assert revoked_retry_resp.status_code == 401


@pytest.mark.anyio
async def test_rbac_matrix_barriers(client: AsyncClient):
    """Verify RBAC barriers prevent unauthorized cross-role access (docs/12_Security.md §4)."""
    # 1. Authenticate Student
    student_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.edu", "password": "demo-password"},
    )
    student_token = student_login.json()["access_token"]
    student_header = {"Authorization": f"Bearer {student_token}"}

    # Student CAN access student barrier
    res = await client.get("/api/v1/auth/test/student", headers=student_header)
    assert res.status_code == 200

    # Student CANNOT access agent barrier (403 Forbidden)
    res = await client.get("/api/v1/auth/test/agent", headers=student_header)
    assert res.status_code == 403
    assert res.json()["error"] == "forbidden"

    # Student CANNOT access knowledge admin barrier (403 Forbidden)
    res = await client.get("/api/v1/auth/test/knowledge-admin", headers=student_header)
    assert res.status_code == 403

    # Student CANNOT access admin barrier (403 Forbidden)
    res = await client.get("/api/v1/auth/test/admin", headers=student_header)
    assert res.status_code == 403

    # 2. Authenticate Knowledge Admin
    kadmin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin.knowledge@example.edu", "password": "demo-password"},
    )
    kadmin_token = kadmin_login.json()["access_token"]
    kadmin_header = {"Authorization": f"Bearer {kadmin_token}"}

    # Knowledge Admin CAN access knowledge-admin barrier
    res = await client.get("/api/v1/auth/test/knowledge-admin", headers=kadmin_header)
    assert res.status_code == 200

    # Knowledge Admin CANNOT access agent queue (403 Forbidden)
    res = await client.get("/api/v1/auth/test/agent", headers=kadmin_header)
    assert res.status_code == 403

    # 3. Authenticate Super Admin (Has universal access)
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.edu", "password": "demo-password"},
    )
    admin_token = admin_login.json()["access_token"]
    admin_header = {"Authorization": f"Bearer {admin_token}"}

    # Super Admin CAN access all barriers
    for endpoint in ["student", "agent", "knowledge-admin", "analytics", "admin"]:
        res = await client.get(f"/api/v1/auth/test/{endpoint}", headers=admin_header)
        assert res.status_code == 200, f"Admin failed on endpoint {endpoint}"


def test_adr007_production_guard():
    """Verify ADR-007 guard: APP_ENV=production raises error if AUTH_PROVIDER=mock."""
    with pytest.raises(RuntimeError, match="CRITICAL SECURITY HAZARD"):
        Settings(APP_ENV="production", AUTH_PROVIDER="mock")
