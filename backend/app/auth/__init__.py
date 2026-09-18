"""Authentication package for CampusOne."""
from .schemas import Role, CurrentUser, LoginRequest, TokenResponse, RefreshTokenRequest, UserMeResponse
from .provider import AuthProvider, get_auth_provider
from .dependencies import get_current_user, require_roles, require_permission

__all__ = [
    "Role",
    "CurrentUser",
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "UserMeResponse",
    "AuthProvider",
    "get_auth_provider",
    "get_current_user",
    "require_roles",
    "require_permission",
]
