from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    navidrome_url: str = "http://localhost:4533"
    navidrome_user: str = "admin"
    navidrome_pass: str = "admin"
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
