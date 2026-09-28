"""CampusOne FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager
import logging
import os
from typing import Dict, Any
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api.v1 import api_router

logger = logging.getLogger(__name__)

try:
    from backend.graph import close_graph, initialize_graph
except ModuleNotFoundError:
    from graph import close_graph, initialize_graph


def configure_langsmith() -> None:
    """Enable LangSmith tracing when explicitly configured with an API key."""
    if not settings.LANGSMITH_TRACING:
        return
    if not settings.LANGSMITH_API_KEY:
        logger.warning("LANGSMITH_TRACING is enabled but LANGSMITH_API_KEY is missing")
        return

    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGSMITH_API_KEY"] = settings.LANGSMITH_API_KEY
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
    os.environ["LANGSMITH_PROJECT"] = settings.LANGSMITH_PROJECT
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
    os.environ["LANGSMITH_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
    os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGSMITH_ENDPOINT


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_langsmith()
    initialize_graph(settings.DATABASE_URL)
    try:
        yield
    finally:
        close_graph()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="CampusOne — Multi-agent campus orchestration and conversational service.",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Standardized error responses conforming to docs/09_API_Reference.md."""
    if isinstance(exc.detail, dict):
        content = exc.detail
    else:
        content = {
            "error": "http_error",
            "message": str(exc.detail),
            "status_code": exc.status_code,
        }
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Standardized Pydantic validation error responses."""
    errors = exc.errors()
    message = errors[0]["msg"] if errors else "Invalid request data"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "validation_error",
            "message": message,
            "details": errors,
        },
    )


# Health check endpoint
@app.get("/api/v1/health", summary="Health check")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "auth_provider": settings.AUTH_PROVIDER,
    }


# Mount API router
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
