from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", populate_by_name=True)

    app_env: str = Field(default="development", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    database_url: str = Field(default="sqlite:///./data/insights.db", alias="DATABASE_URL")
    chroma_persist_dir: str = Field(default="./data/chroma", alias="CHROMA_PERSIST_DIR")
    csv_data_dir: str = Field(default="./data/csv", alias="CSV_DATA_DIR")
    pdf_data_dir: str = Field(default="./data/pdfs", alias="PDF_DATA_DIR")

    ai_provider: str = Field(default="gemini", alias="AI_PROVIDER")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    ai_model: str = Field(default="", alias="AI_MODEL")
    ai_max_tokens: int = Field(default=4096, alias="AI_MAX_TOKENS")

    @property
    def resolved_model(self) -> str:
        if self.ai_model:
            return self.ai_model
        return "gemini-2.5-flash-lite" if self.ai_provider == "gemini" else "llama-3.3-70b-versatile"

    @property
    def active_api_key(self) -> str:
        return self.groq_api_key if self.ai_provider == "groq" else self.gemini_api_key

    app_api_key: str = Field(default="", alias="APP_API_KEY")
    require_api_key: bool = Field(default=False, alias="REQUIRE_API_KEY")
    max_query_results: int = Field(default=100, alias="MAX_QUERY_RESULTS")
    request_timeout_seconds: int = Field(default=60, alias="REQUEST_TIMEOUT_SECONDS")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

@lru_cache()
def get_settings() -> Settings:
    return Settings()
