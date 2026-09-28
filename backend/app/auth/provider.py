"""Authentication provider protocol and implementations (Mock & OIDC seam)."""
import hashlib
import hmac
import secrets
from uuid import uuid4
from typing import Optional, Protocol, Dict, Set, runtime_checkable
import asyncpg
import jwt

from app.core.config import settings
from app.auth.schemas import Role, CurrentUser, UserSummary, TokenResponse
from app.auth.jwt import create_access_token, create_refresh_token, decode_token


def _hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )
    return f"{salt}:{key.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored salt:hash using constant-time comparison."""
    try:
        salt, expected_hex = stored_hash.split(":")
        test_key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        )
        return hmac.compare_digest(test_key.hex(), expected_hex)
    except Exception:
        return False


# Granular Role-Based Permissions Matrix (docs/12_Security.md §4)
ROLE_PERMISSIONS: Dict[Role, list[str]] = {
    Role.STUDENT: [
        "conversations:own",
        "messages:create",
        "knowledge:read_public",
        "handoff:create_own",
    ],
    Role.STAFF: [
        "conversations:own",
        "messages:create",
        "knowledge:read_public",
        "knowledge:read_staff",
        "handoff:create_own",
    ],
    Role.SUPPORT_AGENT: [
        "conversations:assigned",
        "handoffs:triage",
        "handoffs:resolve",
        "knowledge:read",
    ],
    Role.KNOWLEDGE_ADMIN: [
        "knowledge:ingest",
        "knowledge:publish",
        "knowledge:archive",
        "knowledge:read",
        "knowledge:manage",
    ],
    Role.ANALYST: [
        "analytics:read",
        "evaluation:read",
        "evaluation:run",
        "knowledge:read_metadata",
    ],
    Role.ADMIN: [
        "*",  # All permissions
    ],
}


@runtime_checkable
class AuthProvider(Protocol):
    """Abstract identity provider protocol (ADR-007)."""

    async def authenticate(self, email: str, password: str) -> Optional[CurrentUser]:
        """Authenticate user credentials and return CurrentUser or None."""
        ...

    async def verify_token(self, token: str, token_type: str = "access") -> Optional[CurrentUser]:
        """Verify JWT and return CurrentUser if valid."""
        ...

    async def refresh_tokens(self, refresh_token: str) -> Optional[TokenResponse]:
        """Exchange valid refresh token for a fresh token pair."""
        ...

    async def get_user(self, user_id: str) -> Optional[CurrentUser]:
        """Fetch user by canonical user_id."""
        ...

    async def revoke_refresh_token(self, refresh_token: str) -> bool:
        """Revoke a refresh token on logout."""
        ...


class MockAuthProvider:
    """Mock identity provider with PostgreSQL-backed accounts and signed HMAC JWTs."""

    def __init__(self) -> None:
        # Track valid active refresh tokens for rotation & revocation
        self._active_refresh_tokens: Set[str] = set()

        # Seeded demo credentials and persona accounts (docs/15_Demo_Runbook.md & 17_Engineering_Decisions.md)
        demo_pwd_hash = _hash_password("demo-password", salt="campusone_demo_salt_2026")

        self._users_by_email: Dict[str, dict] = {
            "student@example.edu": {
                "id": "u-student-01",
                "external_subject": "mock-sub-alex-rivera",
                "email": "student@example.edu",
                "display_name": "Alex Rivera",
                "role": Role.STUDENT,
                "department": "Undergraduate College",
                "password_hash": demo_pwd_hash,
            },
            "agent@example.edu": {
                "id": "u-agent-01",
                "external_subject": "mock-sub-sarah-jenkins",
                "email": "agent@example.edu",
                "display_name": "Sarah Jenkins",
                "role": Role.SUPPORT_AGENT,
                "department": "Central IT & Triage Queue",
                "password_hash": demo_pwd_hash,
            },
            "admin.knowledge@example.edu": {
                "id": "u-kadmin-01",
                "external_subject": "mock-sub-patricia-cole",
                "email": "admin.knowledge@example.edu",
                "display_name": "Dr. Patricia Cole",
                "role": Role.KNOWLEDGE_ADMIN,
                "department": "Registrar & Policy Administration",
                "password_hash": demo_pwd_hash,
            },
            # Registrar alias matching fixture persona
            "registrar@example.edu": {
                "id": "u-kadmin-01",
                "external_subject": "mock-sub-patricia-cole",
                "email": "admin.knowledge@example.edu",
                "display_name": "Dr. Patricia Cole",
                "role": Role.KNOWLEDGE_ADMIN,
                "department": "Registrar & Policy Administration",
                "password_hash": demo_pwd_hash,
            },
            "executive@example.edu": {
                "id": "u-exec-01",
                "external_subject": "mock-sub-marcus-vance",
                "email": "executive@example.edu",
                "display_name": "Dr. Marcus Vance",
                "role": Role.ANALYST,
                "department": "Vice Chancellor Office",
                "password_hash": demo_pwd_hash,
            },
            "analyst@example.edu": {
                "id": "u-exec-01",
                "external_subject": "mock-sub-marcus-vance",
                "email": "executive@example.edu",
                "display_name": "Dr. Marcus Vance",
                "role": Role.ANALYST,
                "department": "Vice Chancellor Office",
                "password_hash": demo_pwd_hash,
            },
            "admin@example.edu": {
                "id": "u-admin-01",
                "external_subject": "mock-sub-sysadmin",
                "email": "admin@example.edu",
                "display_name": "System Administrator",
                "role": Role.ADMIN,
                "department": "Information Technology Services",
                "password_hash": demo_pwd_hash,
            },
        }

        self._database_url = settings.DATABASE_URL.replace(
            "postgresql+psycopg://", "postgresql://", 1
        )
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(
                self._database_url, min_size=1, max_size=5
            )
        return self._pool

    async def _ensure_schema(self, connection: asyncpg.Connection) -> None:
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS campus_users (
                email VARCHAR(254) PRIMARY KEY,
                id VARCHAR(128) NOT NULL,
                external_subject VARCHAR(255) NOT NULL,
                display_name VARCHAR(120),
                role VARCHAR(32) NOT NULL,
                department VARCHAR(255),
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        for user in self._users_by_email.values():
            await connection.execute(
                """
                INSERT INTO campus_users
                    (email, id, external_subject, display_name, role, department, password_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (email) DO NOTHING
                """,
                user["email"],
                user["id"],
                user["external_subject"],
                user.get("display_name"),
                user["role"].value,
                user.get("department"),
                user["password_hash"],
            )

    @staticmethod
    def _row_to_current_user(row: asyncpg.Record) -> CurrentUser:
        role = Role(row["role"])
        return CurrentUser(
            id=row["id"],
            external_subject=row["external_subject"],
            email=row["email"],
            role=role,
            department=row["department"],
            display_name=row["display_name"],
            permissions=ROLE_PERMISSIONS.get(role, []),
        )

    async def authenticate(self, email: str, password: str) -> Optional[CurrentUser]:
        clean_email = email.strip().lower()
        pool = await self._get_pool()
        async with pool.acquire() as connection:
            await self._ensure_schema(connection)
            user_record = await connection.fetchrow(
                "SELECT * FROM campus_users WHERE email = $1", clean_email
            )
        if not user_record or not _verify_password(password, user_record["password_hash"]):
            return None
        return self._row_to_current_user(user_record)

    async def register_student(
        self, email: str, password: str, display_name: str
    ) -> Optional[CurrentUser]:
        clean_email = email.strip().lower()
        user_record = {
            "id": f"u-student-{uuid4().hex[:12]}",
            "external_subject": f"mock-sub-{uuid4().hex}",
            "email": clean_email,
            "display_name": display_name.strip(),
            "role": Role.STUDENT,
            "department": "Undergraduate College",
            "password_hash": _hash_password(password),
        }
        pool = await self._get_pool()
        async with pool.acquire() as connection:
            await self._ensure_schema(connection)
            try:
                await connection.execute(
                    """
                    INSERT INTO campus_users
                        (email, id, external_subject, display_name, role, department, password_hash)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    clean_email,
                    user_record["id"],
                    user_record["external_subject"],
                    user_record["display_name"],
                    user_record["role"].value,
                    user_record["department"],
                    user_record["password_hash"],
                )
            except asyncpg.UniqueViolationError:
                return None
        return CurrentUser(
            id=user_record["id"],
            external_subject=user_record["external_subject"],
            email=clean_email,
            role=Role.STUDENT,
            department=user_record["department"],
            display_name=user_record["display_name"],
            permissions=ROLE_PERMISSIONS[Role.STUDENT],
        )

    async def verify_token(self, token: str, token_type: str = "access") -> Optional[CurrentUser]:
        try:
            payload = decode_token(token)
            if payload.get("type") != token_type:
                return None
            user_id = payload.get("sub")
            if not user_id:
                return None
            user = await self.get_user(user_id)
            if not user:
                return None
            return user.model_copy(
                update={"session_id": payload.get("jti")}
            )
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

    async def issue_tokens(self, user: CurrentUser) -> TokenResponse:
        """Issue access and refresh token pair for user."""
        claims = {
            "sub": user.id,
            "email": user.email,
            "role": user.role.value,
            "department": user.department,
            "display_name": user.display_name,
        }
        access_token = create_access_token(claims)
        refresh_token = create_refresh_token(claims)

        # Store refresh token
        self._active_refresh_tokens.add(refresh_token)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserSummary(
                id=user.id,
                email=user.email,
                role=user.role,
                department=user.department,
                display_name=user.display_name,
            ),
        )

    async def refresh_tokens(self, refresh_token: str) -> Optional[TokenResponse]:
        if refresh_token not in self._active_refresh_tokens:
            return None

        user = await self.verify_token(refresh_token, token_type="refresh")
        if not user:
            # Stale or invalid token, discard if present
            self._active_refresh_tokens.discard(refresh_token)
            return None

        # Rotate refresh token
        self._active_refresh_tokens.discard(refresh_token)
        return await self.issue_tokens(user)

    async def get_user(self, user_id: str) -> Optional[CurrentUser]:
        pool = await self._get_pool()
        async with pool.acquire() as connection:
            await self._ensure_schema(connection)
            user_record = await connection.fetchrow(
                "SELECT * FROM campus_users WHERE id = $1", user_id
            )
        return self._row_to_current_user(user_record) if user_record else None

    async def revoke_refresh_token(self, refresh_token: str) -> bool:
        if refresh_token in self._active_refresh_tokens:
            self._active_refresh_tokens.remove(refresh_token)
            return True
        return False


class OidcAuthProvider:
    """Enterprise OIDC identity provider seam for production SSO integration (ADR-007)."""

    def __init__(self) -> None:
        raise NotImplementedError(
            "OidcAuthProvider requires enterprise IdP configuration (discovery URL, client ID, keys). "
            "For local evaluation or hackathons, use AUTH_PROVIDER=mock."
        )


# Singleton instance of active provider
_active_provider: Optional[AuthProvider] = None


def get_auth_provider() -> AuthProvider:
    """FastAPI dependency for accessing the configured AuthProvider."""
    global _active_provider
    if _active_provider is None:
        if settings.AUTH_PROVIDER == "mock":
            _active_provider = MockAuthProvider()
        elif settings.AUTH_PROVIDER == "oidc":
            _active_provider = OidcAuthProvider()
        else:
            raise ValueError(f"Unknown AUTH_PROVIDER: {settings.AUTH_PROVIDER}")
    return _active_provider
