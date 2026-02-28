from typing import List
from app.models import Song
from app.services.navidrome_client import NavidromeClient

class MockRecommenderService:
    """
    A mock implementation of the recommender that simply requests
    random songs from the Navidrome server, ignoring the seed song.
    """
    async def get_recommendations(
        self, 
        seed_song_ids: List[str], 
        navidrome_client: NavidromeClient, 
        count: int = 20
    ) -> List[Song]:
        # Fetch the seed songs first
        seed_songs = []
        for sid in seed_song_ids:
            song = await navidrome_client.get_song(sid)
            if song:
                seed_songs.append(song)
                
        # Calculate how many random songs we need
        remaining = count - len(seed_songs)
        
        # For the V1 prototype, we just return random songs
        if remaining > 0:
            random_songs = await navidrome_client.get_random_songs(count=remaining)
            seed_songs.extend(random_songs)
            
        return seed_songs
