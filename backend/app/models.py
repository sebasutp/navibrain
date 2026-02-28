from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class PlaylistSongLink(SQLModel, table=True):
    playlist_id: Optional[int] = Field(default=None, foreign_key="playlist.id", primary_key=True)
    song_id: Optional[str] = Field(default=None, foreign_key="song.id", primary_key=True)
    order_index: int = 0

class SongBase(SQLModel):
    id: str = Field(primary_key=True)
    title: str
    artist: str
    album: Optional[str] = None
    duration: Optional[int] = None

class Song(SongBase, table=True):
    playlists: List["Playlist"] = Relationship(back_populates="songs", link_model=PlaylistSongLink)

class PlaylistBase(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    navidrome_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Playlist(PlaylistBase, table=True):
    songs: List["Song"] = Relationship(back_populates="playlists", link_model=PlaylistSongLink)

class PlaylistRead(PlaylistBase):
    songs: List[SongBase] = []
