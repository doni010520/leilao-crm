from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Agent identity
    agent_name: str = "LeilãoAgent"
    agent_phone: str = ""
    agency_name: str = "Minha Imobiliária"
    organization_id: str = ""  # Supabase org UUID — ties agent to a tenant

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    openai_max_tokens: int = 1200
    openai_temperature: float = 0.3

    # Supabase (shared database with web/)
    supabase_url: str = ""
    supabase_service_key: str = ""  # service_role key — bypasses RLS

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_buffer_seconds: int = 4

    # UAZ / WhatsApp
    uaz_base_url: str = ""
    uaz_token: str = ""
    uaz_webhook_secret: str = ""

    # Admin phones (comma-separated)
    admin_phones: str = ""

    # RAG
    rag_enabled: bool = False
    rag_top_k: int = 5

    # Scraper
    scraper_caixa_enabled: bool = True
    scraper_zuk_enabled: bool = True
    scraper_interval_hours: int = 12

    # Flags
    dry_run: bool = False
    debug: bool = False

    @property
    def admin_phone_list(self) -> list[str]:
        return [p.strip() for p in self.admin_phones.split(",") if p.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
