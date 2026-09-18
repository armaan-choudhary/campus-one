"""FastAPI dependencies for user authentication and role-based access control."""
from typing import List, Union, Callable
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.schemas import Role, CurrentUser
from app.auth.provider import AuthProvider, get_auth_provider

# HTTPBearer security scheme with auto_error=False to provide custom JSON error responses
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Union[HTTPAuthorizationCredentials, None] = Security(bearer_scheme),
    provider: AuthProvider = Depends(get_auth_provider),
) -> CurrentUser:
    """Validate bearer token from Authorization header and return CurrentUser."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "unauthorized", "message": "Missing authentication credentials"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await provider.verify_token(credentials.credentials, token_type="access")
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "unauthorized", "message": "Invalid or expired access token"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_roles(*allowed_roles: Union[Role, str]) -> Callable:
    """Dependency factory that enforces Role-Based Access Control (RBAC).

    Super administrators (Role.ADMIN) bypass specific role restrictions.
    """
    normalized_roles: List[Role] = []
    for r in allowed_roles:
        if isinstance(r, Role):
            normalized_roles.append(r)
        else:
            normalized_roles.append(Role.normalize(r))

    async def role_checker(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        # System admin has full operational access
        if current_user.role == Role.ADMIN:
            return current_user

        if current_user.role not in normalized_roles:
            role_names = ", ".join(r.value for r in normalized_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "forbidden",
                    "message": f"Role '{current_user.role.value}' is unauthorized. Requires one of: [{role_names}].",
                },
            )
        return current_user

    return role_checker


def require_permission(permission: str) -> Callable:
    """Dependency factory checking fine-grained permissions."""

    async def permission_checker(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        # Admin or wildcard permission
        if "*" in current_user.permissions or current_user.role == Role.ADMIN:
            return current_user

        if permission not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "forbidden",
                    "message": f"Missing required permission: '{permission}'.",
                },
            )
        return current_user

    return permission_checker
