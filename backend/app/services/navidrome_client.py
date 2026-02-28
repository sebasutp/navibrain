import httpx
import hashlib
import string
import random
from typing import List, Optional

from app.models import Song

class NavidromeClient:
    def __init__(self, base_url: str, user: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.user = user
        self.password = password
        self.client_version = "1.16.1"
        self.client_name = "navibrain"

    def _get_auth_params(self) -> dict:
        salt = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        token = hashlib.md5((self.password + salt).encode('utf-8')).hexdigest()
        
        return {
            "u": self.user,
            "t": token,
            "s": salt,
            "v": self.client_version,
            "c": self.client_name,
            "f": "json"
        }

    def _parse_song(self, data: dict) -> Song:
        return Song(
            id=data.get("id"),
            title=data.get("title", "Unknown Title"),
            artist=data.get("artist", "Unknown Artist"),
            album=data.get("album"),
            duration=data.get("duration")
        )

    async def search_songs(self, query: str, limit: int = 50, offset: int = 0) -> List[Song]:
        params = self._get_auth_params()
        params.update({"query": query, "songCount": limit, "songOffset": offset})
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/rest/search3", params=params)
            response.raise_for_status()
            data = response.json()
            
            songs_data = data.get("subsonic-response", {}).get("searchResult3", {}).get("song", [])
            return [self._parse_song(s) for s in songs_data]

    async def get_song(self, song_id: str) -> Optional[Song]:
        params = self._get_auth_params()
        params.update({"id": song_id})
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/rest/getSong", params=params)
            response.raise_for_status()
            data = response.json()
            
            song_data = data.get("subsonic-response", {}).get("song")
            if song_data:
                return self._parse_song(song_data)
            return None

    async def get_random_songs(self, count: int = 10) -> List[Song]:
        params = self._get_auth_params()
        params.update({"size": count})
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/rest/getRandomSongs", params=params)
            response.raise_for_status()
            data = response.json()
            
            songs_data = data.get("subsonic-response", {}).get("randomSongs", {}).get("song", [])
            return [self._parse_song(s) for s in songs_data]

    async def create_playlist(self, name: str) -> Optional[str]:
        params = self._get_auth_params()
        params.update({"name": name})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/rest/createPlaylist", params=params)
            response.raise_for_status()
            data = response.json()
            
            return data.get("subsonic-response", {}).get("playlist", {}).get("id")

    async def add_songs_to_playlist(self, playlist_id: str, song_ids: List[str]) -> bool:
        if not song_ids:
            return True
            
        params = self._get_auth_params()
        params.update({"playlistId": playlist_id})
        
        # Subsonic API handles multiple songId params in a list
        query_params = list(params.items())
        for sid in song_ids:
            query_params.append(("songIdToAdd", sid))
            
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/rest/updatePlaylist", params=query_params)
            response.raise_for_status()
            data = response.json()
            
            return data.get("subsonic-response", {}).get("status") == "ok"

    async def get_playlists(self) -> List[dict]:
        params = self._get_auth_params()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/rest/getPlaylists", params=params)
            response.raise_for_status()
            data = response.json()
            
            return data.get("subsonic-response", {}).get("playlists", {}).get("playlist", [])
            
    async def delete_playlist(self, playlist_id: str) -> bool:
        params = self._get_auth_params()
        params.update({"id": playlist_id})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/rest/deletePlaylist", params=params)
            response.raise_for_status()
            data = response.json()
            
            return data.get("subsonic-response", {}).get("status") == "ok"
