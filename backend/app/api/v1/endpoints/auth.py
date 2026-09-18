"""Authentication endpoints conforming to docs/09_API_Reference.md §3."""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.schemas import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserMeResponse,
    CurrentUser,
    Role,
)
from app.auth.provider import AuthProvider, MockAuthProvider, get_auth_provider
from app.auth.dependencies import get_current_user, require_roles

router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login",
    description="Authenticate seeded student, staff, agent, knowledge admin, or executive account.",
)
async def login(
    request: LoginRequest,
    provider: AuthProvider = Depends(get_auth_provider),
) -> TokenResponse:
    user = await provider.authenticate(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "invalid_credentials", "message": "Invalid email or password"},
        )

    if isinstance(provider, MockAuthProvider):
        tokens = await provider.issue_tokens(user)
        return tokens

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={"error": "auth_provider_unavailable", "message": "Unsupported provider flow"},
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh Token",
    description="Exchange valid refresh token for a new access/refresh token pair.",
)
async def refresh_token(
    request: RefreshTokenRequest,
    provider: AuthProvider = Depends(get_auth_provider),
) -> TokenResponse:
    tokens = await provider.refresh_tokens(request.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "invalid_refresh_token", "message": "Invalid, expired, or revoked refresh token"},
        )
    return tokens


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Current User Profile",
    description="Retrieve identity, role, and permission scopes for the authenticated token.",
)
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
) -> UserMeResponse:
    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        department=current_user.department,
        display_name=current_user.display_name,
        permissions=current_user.permissions,
    )


@router.post(
    "/logout",
    summary="User Logout",
    description="Revoke the provided refresh token session.",
)
async def logout(
    request: RefreshTokenRequest,
    provider: AuthProvider = Depends(get_auth_provider),
) -> Dict[str, Any]:
    revoked = await provider.revoke_refresh_token(request.refresh_token)
    return {
        "status": "success",
        "revoked": revoked,
        "message": "Logged out successfully",
    }


# ==============================================================================
# RBAC Barrier Test Endpoints (For Automated & Verification Testing)
# ==============================================================================

@router.get("/test/student", summary="Student only barrier")
async def test_student_only(
    current_user: CurrentUser = Depends(require_roles(Role.STUDENT)),
) -> Dict[str, Any]:
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "email": current_user.email,
        "view": "student_inquiry_workspace",
    }


@router.get("/test/agent", summary="Support Agent only barrier")
async def test_agent_only(
    current_user: CurrentUser = Depends(require_roles(Role.SUPPORT_AGENT)),
) -> Dict[str, Any]:
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "email": current_user.email,
        "view": "triage_and_escalations_queue",
    }


@router.get("/test/knowledge-admin", summary="Knowledge Admin only barrier")
async def test_knowledge_admin_only(
    current_user: CurrentUser = Depends(require_roles(Role.KNOWLEDGE_ADMIN)),
) -> Dict[str, Any]:
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "email": current_user.email,
        "view": "corpus_management_and_ingestion",
    }


@router.get("/test/analytics", summary="Analyst & Executive barrier")
async def test_analytics_only(
    current_user: CurrentUser = Depends(require_roles(Role.ANALYST, Role.ADMIN)),
) -> Dict[str, Any]:
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "email": current_user.email,
        "view": "evaluation_and_confusion_matrix",
    }


@router.get("/test/admin", summary="Super Administrator only barrier")
async def test_admin_only(
    current_user: CurrentUser = Depends(require_roles(Role.ADMIN)),
) -> Dict[str, Any]:
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "email": current_user.email,
        "view": "system_configuration_and_audit",
    }
