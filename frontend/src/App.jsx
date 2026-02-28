import React, { useState } from 'react';
import SongSelector from './components/SongSelector';
import PlaylistViewer from './components/PlaylistViewer';
import SeedManager from './components/SeedManager';
import MyPlaylists from './components/MyPlaylists';
import './index.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function App() {
  const PAGE_SIZE = parseInt(import.meta.env.VITE_PAGE_SIZE) || 10;
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeeds, setSelectedSeeds] = useState([]);
  const [targetSize, setTargetSize] = useState(20);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'playlists'

  const fetchSongs = async (query, offset, append = false) => {
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/songs?query=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) throw new Error('Failed to search songs');
      const data = await res.json();
      if (append) {
        setSearchResults((prev) => [...prev, ...data]);
      } else {
        setSearchResults(data);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query) => {
    setCurrentQuery(query);
    setPage(0);
    fetchSongs(query, 0, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSongs(currentQuery, nextPage * PAGE_SIZE, true);
  };

  const handleSelectSeed = (song) => {
    if (!selectedSeeds.find(s => s.id === song.id)) {
      setSelectedSeeds([...selectedSeeds, song]);
    }
  };

  const handleRemoveSeed = (songId) => {
    setSelectedSeeds(selectedSeeds.filter(s => s.id !== songId));
  };

  const handleGenerate = async () => {
    if (selectedSeeds.length === 0) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/playlists/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seed_song_ids: selectedSeeds.map(s => s.id),
          name: `Playlist based on ${selectedSeeds[0].title}${selectedSeeds.length > 1 ? ' and others' : ''}`,
          target_size: targetSize
        })
      });
      if (!res.ok) throw new Error('Failed to generate playlist');
      const data = await res.json();
      setCurrentPlaylist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSync = async () => {
    if (!currentPlaylist) return;
    setIsSyncing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/playlists/${currentPlaylist.id}/sync`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to sync playlist');
      const data = await res.json();
      setCurrentPlaylist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in">
        <h1 className="title-gradient" style={{ fontSize: '3.5rem', fontWeight: '800' }}>Navibrain</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
          Dynamic intelligence for your Navidrome server
        </p>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {error && (
          <div className="error-message glass-panel" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('generate')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'generate' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'generate' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Generator
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'playlists' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'playlists' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            My Playlists
          </button>
        </div>

        {activeTab === 'generate' ? (
          <>
            <div className="glass-panel animate-fade-in" style={{ padding: '2rem', animationDelay: '0.1s' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>1. Select Seeds</h2>

              <SeedManager
                selectedSeeds={selectedSeeds}
                onRemoveSeed={handleRemoveSeed}
                targetSize={targetSize}
                onTargetSizeChange={setTargetSize}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />

              <SongSelector
                onSearch={handleSearch}
                onSelect={handleSelectSeed}
                searchResults={searchResults}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
              />
              {isSearching && <div style={{ marginTop: '1rem', color: 'var(--accent-color)' }}>Searching...</div>}
            </div>

            {(isGenerating || currentPlaylist) && (
              <div className="glass-panel animate-fade-in" style={{ padding: '2rem', animationDelay: '0.2s' }}>
                {isGenerating ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--accent-color)' }}>
                    <h2>Generating your dynamic playlist...</h2>
                    <p>Analyzing {selectedSeeds.length} seed(s)</p>
                  </div>
                ) : (
                  <PlaylistViewer
                    playlist={currentPlaylist}
                    onSync={handleSync}
                    isSyncing={isSyncing}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <MyPlaylists />
        )}
      </main>
    </div>
  );
}

export default App;
