import pytest
import httpx
from app.services.navidrome_client import NavidromeClient

@pytest.fixture
def mock_navidrome_client(monkeypatch):
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self._json_data = json_data
            self.status_code = status_code
            
        def json(self):
            return self._json_data
            
        def raise_for_status(self):
            if self.status_code >= 400:
                raise httpx.HTTPStatusError("Error", request=None, response=self)

    class MockAsyncClient:
        async def __aenter__(self):
            return self
            
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None):
            if "search3" in url:
                return MockResponse({
                    "subsonic-response": {
                        "status": "ok",
                        "searchResult3": {
                            "song": [
                                {"id": "1", "title": "Song 1", "artist": "Artist 1", "album": "Album 1", "duration": 180},
                                {"id": "2", "title": "Song 2", "artist": "Artist 2", "album": "Album 2", "duration": 200},
                            ]
                        }
                    }
                })
            elif "getRandomSongs" in url:
                return MockResponse({
                    "subsonic-response": {
                        "status": "ok",
                        "randomSongs": {
                            "song": [
                                {"id": "3", "title": "Random 1", "artist": "Artist 3", "album": "Album 3", "duration": 150},
                            ]
                        }
                    }
                })
            elif "getPlaylists" in url:
                return MockResponse({
                    "subsonic-response": {
                        "status": "ok",
                        "playlists": {
                            "playlist": [
                                {"id": "p1", "name": "navibrain_test", "owner": "user", "songCount": 10},
                                {"id": "p2", "name": "other_playlist", "owner": "user", "songCount": 5}
                            ]
                        }
                    }
                })
            return MockResponse({"subsonic-response": {"status": "failed"}}, status_code=404)

        async def post(self, url, params=None):
            if "createPlaylist" in url:
                 return MockResponse({
                    "subsonic-response": {
                        "status": "ok",
                        "playlist": {
                            "id": "new-playlist-id",
                            "name": params.get("name")
                        }
                    }
                })
            elif "updatePlaylist" in url:
                return MockResponse({
                    "subsonic-response": {
                        "status": "ok"
                    }
                })
            elif "deletePlaylist" in url:
                return MockResponse({
                    "subsonic-response": {
                        "status": "ok"
                    }
                })
            return MockResponse({"subsonic-response": {"status": "failed"}}, status_code=404)

    monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)
    return NavidromeClient(base_url="http://mock", user="user", password="password")

@pytest.mark.asyncio
async def test_search_songs(mock_navidrome_client):
    songs = await mock_navidrome_client.search_songs(query="test")
    assert len(songs) == 2
    assert songs[0].id == "1"
    assert songs[0].title == "Song 1"

@pytest.mark.asyncio
async def test_get_random_songs(mock_navidrome_client):
    songs = await mock_navidrome_client.get_random_songs(count=1)
    assert len(songs) == 1
    assert songs[0].id == "3"
    assert songs[0].title == "Random 1"

@pytest.mark.asyncio
async def test_create_and_populate_playlist(mock_navidrome_client):
    playlist_id = await mock_navidrome_client.create_playlist(name="Test Playlist")
    assert playlist_id == "new-playlist-id"
    
    success = await mock_navidrome_client.add_songs_to_playlist(playlist_id="new-playlist-id", song_ids=["1", "2"])
    assert success is True

@pytest.mark.asyncio
async def test_get_playlists(mock_navidrome_client):
    playlists = await mock_navidrome_client.get_playlists()
    assert len(playlists) == 2
    assert playlists[0]["id"] == "p1"
    assert playlists[0]["name"] == "navibrain_test"

@pytest.mark.asyncio
async def test_delete_playlist(mock_navidrome_client):
    success = await mock_navidrome_client.delete_playlist("p1")
    assert success is True
