from sqlmodel import Session, select
from app.models import Song, Playlist, PlaylistSongLink

def test_create_song(session: Session):
    song = Song(id="song-1", title="Test Song", artist="Test Artist")
    session.add(song)
    session.commit()

    song_db = session.exec(select(Song).where(Song.id == "song-1")).first()
    assert song_db is not None
    assert song_db.title == "Test Song"
    assert song_db.artist == "Test Artist"

def test_create_playlist(session: Session):
    playlist = Playlist(name="My Playist")
    session.add(playlist)
    session.commit()

    playlist_db = session.exec(select(Playlist).where(Playlist.name == "My Playist")).first()
    assert playlist_db is not None
    assert playlist_db.id is not None

def test_add_song_to_playlist(session: Session):
    song = Song(id="song-1", title="Test Song", artist="Test Artist")
    playlist = Playlist(name="My Playist")
    
    session.add(song)
    session.add(playlist)
    session.commit()
    
    # Needs to refresh to get the generated IDs
    session.refresh(song)
    session.refresh(playlist)
    
    link = PlaylistSongLink(playlist_id=playlist.id, song_id=song.id)
    session.add(link)
    session.commit()
    
    playlist_db = session.exec(select(Playlist).where(Playlist.id == playlist.id)).first()
    assert len(playlist_db.songs) == 1
    assert playlist_db.songs[0].id == "song-1"
