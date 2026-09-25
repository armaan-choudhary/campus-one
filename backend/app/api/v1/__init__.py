"""API v1 package."""
from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])

__all__ = ["api_router"]
