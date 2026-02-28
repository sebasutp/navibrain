import pytest
from app.services.recommender import MockRecommenderService
from app.models import Song

@pytest.fixture
def mock_recommender():
    return MockRecommenderService()

@pytest.mark.asyncio
async def test_mock_recommender_returns_random_songs():
    # Setup
    class DummyNavidromeClient:
        async def get_random_songs(self, count):
            return [
                Song(id=f"song-{i}", title=f"Title {i}", artist=f"Artist {i}")
                for i in range(count)
            ]
            
        async def get_song(self, song_id):
            return Song(id=song_id, title=f"Seed {song_id}", artist="Artist")

    # Test
    client = DummyNavidromeClient()
    recommender = MockRecommenderService()
    
    songs = await recommender.get_recommendations(
        seed_song_ids=["seed-1"], 
        navidrome_client=client, 
        count=5
    )
    
    assert len(songs) == 5
    assert all(isinstance(s, Song) for s in songs)
