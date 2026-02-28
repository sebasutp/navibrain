from sqlmodel import SQLModel, create_engine, Session
from app.models import Song, Playlist, PlaylistSongLink
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./navibrain.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

def get_session():
    with Session(engine) as session:
        yield session
