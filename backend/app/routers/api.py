from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel

from app.database import get_session
from app.models import Song, Playlist, PlaylistSongLink, PlaylistRead
from app.services.navidrome_client import NavidromeClient
from app.services.recommender import MockRecommenderService
from app.config import settings

router = APIRouter(prefix="/api")

# Dependency wrappers so they can be overridden in tests
def get_navidrome_client():
    return NavidromeClient(
        base_url=settings.navidrome_url,
        user=settings.navidrome_user,
        password=settings.navidrome_pass
    )

def get_recommender():
    return MockRecommenderService()

class GenerateRequest(BaseModel):
    seed_song_ids: List[str]
    name: str
    target_size: int = 20

class RenameRequest(BaseModel):
    name: str

class AddSongRequest(BaseModel):
    song_id: str

@router.get("/songs", response_model=List[Song])
async def search_songs(
    query: str,
    limit: int = 10,
    offset: int = 0,
    client: NavidromeClient = Depends(get_navidrome_client)
):
    try:
        return await client.search_songs(query, limit, offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/playlists/generate", response_model=PlaylistRead)
async def generate_playlist(
    request: GenerateRequest,
    session: Session = Depends(get_session),
    client: NavidromeClient = Depends(get_navidrome_client),
    recommender: MockRecommenderService = Depends(get_recommender)
):
    try:
        # Get recommended songs
        recommended_songs = await recommender.get_recommendations(
            seed_song_ids=request.seed_song_ids,
            navidrome_client=client,
            count=request.target_size
        )
        
        # 2. Add the recommended songs to the database if they don't exist
        for song in recommended_songs:
            existing_song = session.exec(select(Song).where(Song.id == song.id)).first()
            if not existing_song:
                session.add(song)
                
        # 3. Create a new Playlist record in the database
        playlist = Playlist(name=request.name)
        session.add(playlist)
        session.commit()
        session.refresh(playlist)
        
        # 4. Link the recommended songs to the new playlist
        for idx, song in enumerate(recommended_songs):
            song_link = PlaylistSongLink(playlist_id=playlist.id, song_id=song.id, order_index=idx)
            session.add(song_link)
            
        session.commit()
        session.refresh(playlist)
        
        # Explicitly fetching it with relationships loaded
        playlist_read = PlaylistRead.model_validate(playlist)
        playlist_read.songs = recommended_songs
        return playlist_read
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/playlists/{playlist_id}/sync", response_model=PlaylistRead)
async def sync_playlist(
    playlist_id: int,
    session: Session = Depends(get_session),
    client: NavidromeClient = Depends(get_navidrome_client)
):
    playlist = session.exec(select(Playlist).where(Playlist.id == playlist_id)).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    try:
        # 3. Create playlist on Navidrome
        # Prepending the name so we can identify it later
        navidrome_name = f"navibrain_{playlist.name}"
        navidrome_id = await client.create_playlist(navidrome_name)
        if not navidrome_id:
            raise HTTPException(status_code=500, detail="Failed to create playlist on server")
            
        ordered_songs = session.exec(
            select(Song)
            .join(PlaylistSongLink)
            .where(PlaylistSongLink.playlist_id == playlist.id)
            .order_by(PlaylistSongLink.order_index)
        ).all()
        song_ids = [song.id for song in ordered_songs]
        
        success = await client.add_songs_to_playlist(navidrome_id, song_ids)
        
        if success:
            playlist.navidrome_id = navidrome_id
            session.commit()
            session.refresh(playlist)
            
            playlist_read = PlaylistRead.model_validate(playlist)
            playlist_read.songs = ordered_songs
            return playlist_read
        else:
            raise HTTPException(status_code=500, detail="Failed to populate playlist on server")
            
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/playlists/local", response_model=List[PlaylistRead])
def get_local_playlists(session: Session = Depends(get_session)):
    """Fetch all locally stored Navibrain playlists and their songs"""
    playlists = session.exec(select(Playlist)).all()
    
    result = []
    for playlist in playlists:
        ordered_songs = session.exec(
            select(Song)
            .join(PlaylistSongLink)
            .where(PlaylistSongLink.playlist_id == playlist.id)
            .order_by(PlaylistSongLink.order_index)
        ).all()
        
        pr = PlaylistRead.model_validate(playlist)
        pr.songs = ordered_songs
        result.append(pr)
        
    return result

@router.delete("/playlists/local/{playlist_id}")
async def delete_local_playlist(
    playlist_id: int, 
    session: Session = Depends(get_session),
    client: NavidromeClient = Depends(get_navidrome_client)
):
    """Delete a specific local playlist and its Navidrome counterpart if synced"""
    playlist = session.exec(select(Playlist).where(Playlist.id == playlist_id)).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    # Delete from Navidrome if it was synced
    if playlist.navidrome_id:
        try:
            await client.delete_playlist(playlist.navidrome_id)
        except Exception as e:
            # We log but continue, ensuring the local DB is cleaned up
            print(f"Failed to delete playlist from Navidrome: {e}")
            
    # Delete the playlist-song links first
    links = session.exec(select(PlaylistSongLink).where(PlaylistSongLink.playlist_id == playlist_id)).all()
    for link in links:
        session.delete(link)
        
    session.delete(playlist)
    session.commit()
    return {"status": "success", "message": "Playlist deleted"}

@router.put("/playlists/local/{playlist_id}")
async def rename_local_playlist(
    playlist_id: int,
    request: RenameRequest,
    session: Session = Depends(get_session),
    client: NavidromeClient = Depends(get_navidrome_client)
):
    """Rename a local playlist and update Navidrome if synced"""
    playlist = session.exec(select(Playlist).where(Playlist.id == playlist_id)).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    playlist.name = request.name
    
    if playlist.navidrome_id:
        try:
            await client.rename_playlist(playlist.navidrome_id, f"navibrain_{request.name}")
        except Exception as e:
            print(f"Failed to rename playlist on Navidrome: {e}")
            
    session.add(playlist)
    session.commit()
    return {"status": "success"}

@router.post("/playlists/local/{playlist_id}/songs")
async def add_song_to_playlist(
    playlist_id: int,
    request: AddSongRequest,
    session: Session = Depends(get_session),
    client: NavidromeClient = Depends(get_navidrome_client)
):
    """Adds an existing song to a playlist, syncing with Navidrome if applicable"""
    playlist = session.exec(select(Playlist).where(Playlist.id == playlist_id)).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    song = session.exec(select(Song).where(Song.id == request.song_id)).first()
    if not song:
        # Check Navidrome
        try:
            song = await client.get_song(request.song_id)
            if song:
                session.add(song)
                session.commit()
                session.refresh(song)
            else:
                raise HTTPException(status_code=404, detail="Song not found locally or on Navidrome")
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Error looking up song: {e}")
        
        
    # Get highest order_index
    current_links = session.exec(
        select(PlaylistSongLink)
        .where(PlaylistSongLink.playlist_id == playlist_id)
        .order_by(PlaylistSongLink.order_index.desc())
    ).all()
    
    next_index = current_links[0].order_index + 1 if current_links else 0
    
    new_link = PlaylistSongLink(playlist_id=playlist_id, song_id=request.song_id, order_index=next_index)
    session.add(new_link)
    
    if playlist.navidrome_id:
        try:
            await client.add_songs_to_playlist(playlist.navidrome_id, [request.song_id])
        except Exception as e:
            print(f"Failed to add song to Navidrome: {e}")
            
    session.commit()
    return {"status": "success"}

@router.delete("/playlists/local/{playlist_id}/songs/{song_id}")
async def remove_song_from_playlist(
    playlist_id: int,
    song_id: str,
    session: Session = Depends(get_session),
    client: NavidromeClient = Depends(get_navidrome_client)
):
    """Remove a song from a playlist and sync with Navidrome if applicable"""
    playlist = session.exec(select(Playlist).where(Playlist.id == playlist_id)).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    link = session.exec(
        select(PlaylistSongLink)
        .where(PlaylistSongLink.playlist_id == playlist_id)
        .where(PlaylistSongLink.song_id == song_id)
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Song not found in playlist")
        
    # If synced, calculate its index relative to Navidrome list
    if playlist.navidrome_id:
        try:
            # We need the ordered index of this song in the list to remove it from Subsonic
            ordered_links = session.exec(
                select(PlaylistSongLink)
                .where(PlaylistSongLink.playlist_id == playlist_id)
                .order_by(PlaylistSongLink.order_index)
            ).all()
            
            navidrome_idx = next(i for i, l in enumerate(ordered_links) if l.song_id == song_id)
            await client.remove_songs_from_playlist(playlist.navidrome_id, [navidrome_idx])
        except Exception as e:
            print(f"Failed to remove song from Navidrome: {e}")
            
    session.delete(link)
    session.commit()
    return {"status": "success"}

@router.get("/songs/local", response_model=List[Song])
def get_local_songs(session: Session = Depends(get_session)):
    """Fetch all locally stored Navibrain songs"""
    return session.exec(select(Song)).all()

@router.delete("/songs/local/{song_id}")
def delete_local_song(song_id: str, session: Session = Depends(get_session)):
    """Delete a specific local song if it exists"""
    song = session.exec(select(Song).where(Song.id == song_id)).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
        
    # Check if song is part of any playlist
    links = session.exec(select(PlaylistSongLink).where(PlaylistSongLink.song_id == song_id)).all()
    if links:
        raise HTTPException(status_code=400, detail="Cannot delete song because it is linked to one or more playlists")
        
    session.delete(song)
    session.commit()
    return {"status": "success", "message": "Song deleted"}
