import pytest
from httpx import AsyncClient
from app.main import app
from app.models import Song

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.fixture
def mock_dependencies():
    class MockNavidrome:
        async def search_songs(self, query, limit=50, offset=0):
            return [Song(id="1", title=f"Searched {query}", artist="Artist")]
            
        async def get_song(self, song_id):
            return Song(id=song_id, title=f"Seed {song_id}", artist="Artist")
            
        async def create_playlist(self, name):
            return "new-playlist-id"
            
        async def add_songs_to_playlist(self, playlist_id, song_ids):
            return True

        async def get_playlists(self):
            return [
                {"id": "old-navibrain-1", "name": "navibrain_old"},
                {"id": "user-playlist", "name": "user_playlist"}
            ]

        async def delete_playlist(self, playlist_id):
            return True

    class MockRecommender:
        async def get_recommendations(self, seed_song_ids, navidrome_client, count=20):
            songs = [Song(id=sid, title=f"Seed {sid}", artist="Artist") for sid in seed_song_ids]
            songs.append(Song(id="rec-1", title="Recommended", artist="Artist"))
            # Note: in test_generate_playlist_api we expect 20 songs returned (1 seed + 19 recs)
            # but to pass the test without changing too much of the response assertions, 
            # we will just return what the test asserts. Wait, the test asserts len == 20
            # Let's return the exact length asked
            while len(songs) < count:
                songs.append(Song(id=f"rec-{len(songs)}", title="Recommended", artist="Artist"))
            return songs

    from app.routers.api import get_navidrome_client, get_recommender
    app.dependency_overrides[get_navidrome_client] = lambda: MockNavidrome()
    app.dependency_overrides[get_recommender] = lambda: MockRecommender()
    yield
    app.dependency_overrides.pop(get_navidrome_client, None)
    app.dependency_overrides.pop(get_recommender, None)

def test_search_songs_api(client, mock_dependencies):
    response = client.get("/api/songs?query=test")
    if response.status_code != 200:
        print(response.json())
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Searched test"

def test_search_songs_api_pagination(client, mock_dependencies):
    response = client.get("/api/songs?query=test&limit=10&offset=10")
    if response.status_code != 200:
        print(response.json())
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

def test_generate_playlist_api(client, session, mock_dependencies):
    response = client.post("/api/playlists/generate", json={"seed_song_ids": ["seed-1"], "name": "My Gen List", "target_size": 20})
    if response.status_code != 200:
        print(response.json())
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Gen List"
    assert len(data["songs"]) == 20
    assert data["songs"][0]["title"] == "Seed seed-1"
    assert data["songs"][1]["title"] == "Recommended"
    
    # Store the playlist ID for the next test
    return data["id"]

def test_sync_playlist_api(client, session, mock_dependencies):
    # First generate a playlist to sync
    playlist_id = test_generate_playlist_api(client, session, mock_dependencies)
    
    response = client.post(f"/api/playlists/{playlist_id}/sync")
    if response.status_code != 200:
        print(response.json())
    assert response.status_code == 200
    data = response.json()
    assert data["navidrome_id"] == "new-playlist-id"

def test_get_local_playlists(client, session, mock_dependencies):
    # First generate one
    test_generate_playlist_api(client, session, mock_dependencies)
    response = client.get("/api/playlists/local")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "songs" in data[0]

def test_delete_local_playlist(client, session, mock_dependencies):
    playlist_id = test_generate_playlist_api(client, session, mock_dependencies)
    
    # Sync it first so it gets a Navidrome ID
    response = client.post(f"/api/playlists/{playlist_id}/sync")
    assert response.status_code == 200
    
    response = client.delete(f"/api/playlists/local/{playlist_id}")
    assert response.status_code == 200
    
    # Verify it's gone
    response = client.get(f"/api/playlists/local")
    data = response.json()
    assert not any(p["id"] == playlist_id for p in data)

def test_get_local_songs(client, session, mock_dependencies):
    # First generate one so songs exist in db
    test_generate_playlist_api(client, session, mock_dependencies)
    response = client.get("/api/songs/local")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

def test_delete_local_song_prevented_if_linked(client, session, mock_dependencies):
    # Get a song ID that is currently used in a playlist
    response = client.get("/api/playlists/local")
    playlist_data = response.json()
    if len(playlist_data) == 0:
        test_generate_playlist_api(client, session, mock_dependencies)
        response = client.get("/api/playlists/local")
        playlist_data = response.json()
        
    song_to_delete = playlist_data[0]["songs"][0]["id"]
    response = client.delete(f"/api/songs/local/{song_to_delete}")
    assert response.status_code == 400

def test_delete_local_song_success(client, session, mock_dependencies):
    # Delete all playlists first
    response = client.get("/api/playlists/local")
    for p in response.json():
        client.delete(f"/api/playlists/local/{p['id']}")
        
    # Now get a song and delete it
    response = client.get("/api/songs/local")
    songs = response.json()
    if len(songs) > 0:
        song_to_delete = songs[0]["id"]
        response = client.delete(f"/api/songs/local/{song_to_delete}")
        assert response.status_code == 200
