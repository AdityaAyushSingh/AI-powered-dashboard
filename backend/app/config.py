from __future__ import annotations
from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import os


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    database_url: str = Field(default="sqlite:///./data/insights.db", alias="DATABASE_URL")
    chroma_persist_dir: str = Field(default="./data/chroma", alias="CHROMA_PERSIST_DIR")
    csv_data_dir: str = Field(default="./data/csv", alias="CSV_DATA_DIR")
    pdf_data_dir: str = Field(default="./data/pdfs", alias="PDF_DATA_DIR")

    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    ai_model: str = Field(default="gemini-2.5-flash-lite", alias="AI_MODEL")
    ai_max_tokens: int = Field(default=4096, alias="AI_MAX_TOKENS")

    max_query_results: int = Field(default=100, alias="MAX_QUERY_RESULTS")
    request_timeout_seconds: int = Field(default=60, alias="REQUEST_TIMEOUT_SECONDS")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        populate_by_name = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
