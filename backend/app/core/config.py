"""Application configuration loaded from environment variables and defaults."""
import os
from typing import Literal
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "CampusOne"
    APP_ENV: Literal["development", "test", "staging", "production"] = "development"
    DEBUG: bool = False

    # ADR-007: Pluggable Authentication Configuration
    AUTH_PROVIDER: Literal["mock", "oidc"] = "mock"
    JWT_SECRET: str = "campusone-secure-jwt-secret-key-development-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # Database & Vector DB (for future integration)
    DATABASE_URL: str = "postgresql+psycopg://campus_one:campus_one_secret@localhost:5432/campus_one"

    @model_validator(mode="after")
    def validate_production_guards(self) -> "Settings":
        """ADR-007 Mitigation: Application startup raises a fatal error if

        AUTH_PROVIDER=mock is set when APP_ENV=production.
        """
        if self.APP_ENV == "production" and self.AUTH_PROVIDER == "mock":
            raise RuntimeError(
                "CRITICAL SECURITY HAZARD: AUTH_PROVIDER=mock cannot be used when APP_ENV=production. "
                "Configure an enterprise OIDC identity provider (AUTH_PROVIDER=oidc)."
            )
        return self


settings = Settings()
