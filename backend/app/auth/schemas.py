"""Pydantic schemas and models for Authentication and RBAC."""
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class Role(str, Enum):
    STUDENT = "student"
    STAFF = "staff"
    SUPPORT_AGENT = "support_agent"
    KNOWLEDGE_ADMIN = "knowledge_admin"
    ANALYST = "analyst"
    ADMIN = "admin"

    @classmethod
    def normalize(cls, value: str) -> "Role":
        """Normalize frontend persona aliases or input strings to canonical Role."""
        val = value.lower().strip()
        if val in ("agent", "support_agent", "support"):
            return cls.SUPPORT_AGENT
        if val in ("executive", "analyst", "evaluator"):
            return cls.ANALYST
        for member in cls:
            if member.value == val:
                return member
        raise ValueError(f"Invalid role: {value}")


class CurrentUser(BaseModel):
    id: str
    external_subject: str
    email: str
    role: Role
    department: Optional[str] = None
    display_name: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)


class UserSummary(BaseModel):
    id: str
    email: str
    role: Role
    department: Optional[str] = None
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., max_length=254, description="User email address")
    password: str = Field(..., min_length=1, max_length=128, description="User credentials (never logged)")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
    user: UserSummary


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1, description="Valid refresh token")


class UserMeResponse(BaseModel):
    id: str
    email: str
    role: Role
    department: Optional[str] = None
    display_name: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
