import React, { useState } from 'react';
import SongCard from './SongCard';

function SongSelector({ onSearch, onSelect, searchResults = [], onLoadMore, hasMore }) {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <div className="song-selector">
            <div className="search-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Search for a seed song by title or artist..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'var(--text-main)',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                    }}
                />
                <button
                    onClick={handleSearch}
                    disabled={!query.trim()}
                    style={{
                        padding: '0 2rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: query.trim() ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                        color: query.trim() ? 'white' : 'var(--text-muted)',
                        fontWeight: '600',
                        cursor: query.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Search
                </button>
            </div>

            {searchResults.length > 0 && (
                <div className="results-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {searchResults.map((song) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            onClick={() => onSelect(song)}
                            isSelectable={true}
                        />
                    ))}

                    {hasMore && (
                        <button
                            onClick={onLoadMore}
                            style={{
                                padding: '1rem',
                                marginTop: '0.5rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease',
                                fontWeight: '600'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            Load More Results
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default SongSelector;
