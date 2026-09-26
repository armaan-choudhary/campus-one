"""API v1 package."""
from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.chat import router as chat_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])

__all__ = ["api_router"]
