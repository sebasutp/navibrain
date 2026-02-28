import React, { useState, useEffect } from 'react';
import SongCard from './SongCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function MyPlaylists() {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedPlaylistId, setExpandedPlaylistId] = useState(null);

    // Editing States
    const [editingPlaylistId, setEditingPlaylistId] = useState(null);
    const [editName, setEditName] = useState("");

    // Add Song States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const fetchPlaylists = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/playlists/local`);
            if (!res.ok) throw new Error('Failed to fetch playlists');
            const data = await res.json();
            setPlaylists(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const handleDelete = async (playlistId, e) => {
        e.stopPropagation(); // Prevent row expansion when clicking delete
        if (!window.confirm("Are you sure you want to delete this playlist? This will also remove it from Navidrome if synced.")) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/playlists/local/${playlistId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete playlist');

            // Remove from local state
            setPlaylists(playlists.filter(p => p.id !== playlistId));
            if (expandedPlaylistId === playlistId) {
                setExpandedPlaylistId(null);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRenameSubmit = async (playlistId, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        if (!editName.trim()) {
            setEditingPlaylistId(null);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/playlists/local/${playlistId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName })
            });
            if (!res.ok) throw new Error('Failed to rename playlist');

            // Update local state
            setPlaylists(playlists.map(p => p.id === playlistId ? { ...p, name: editName } : p));
            setEditingPlaylistId(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRemoveSong = async (playlistId, songId, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm("Remove this song from the playlist?")) return;

        try {
            const res = await fetch(`${API_BASE}/playlists/local/${playlistId}/songs/${songId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove song');

            // Update local state by stripping the song out
            setPlaylists(playlists.map(p => {
                if (p.id === playlistId) {
                    return { ...p, songs: p.songs.filter(s => s.id !== songId) };
                }
                return p;
            }));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSearchAdd = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`${API_BASE}/songs?query=${encodeURIComponent(searchQuery)}&limit=5`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setSearchResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddSong = async (playlistId, song) => {
        try {
            const res = await fetch(`${API_BASE}/playlists/local/${playlistId}/songs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ song_id: song.id })
            });
            if (!res.ok) throw new Error('Failed to add song');

            // Update local state by appending
            setPlaylists(playlists.map(p => {
                if (p.id === playlistId) {
                    // Prevent duplicates in UI
                    if (p.songs.some(s => s.id === song.id)) return p;
                    return { ...p, songs: [...p.songs, song] };
                }
                return p;
            }));

            setSearchQuery("");
            setSearchResults([]);
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading playlists...</div>;
    if (error) return <div style={{ color: '#fca5a5' }}>Error: {error}</div>;
    if (playlists.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No dynamic playlists found.</div>;

    return (
        <div className="my-playlists" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {playlists.map(playlist => (
                <div
                    key={playlist.id}
                    className="glass-panel animate-fade-in"
                    style={{
                        padding: '1.5rem',
                        cursor: 'pointer',
                        border: expandedPlaylistId === playlist.id ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.05)'
                    }}
                    onClick={() => setExpandedPlaylistId(expandedPlaylistId === playlist.id ? null : playlist.id)}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            {editingPlaylistId === playlist.id ? (
                                <form onSubmit={(e) => handleRenameSubmit(playlist.id, e)} onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={(e) => handleRenameSubmit(playlist.id, e)}
                                        className="search-input"
                                        style={{ marginBottom: '0.5rem', width: '80%' }}
                                    />
                                </form>
                            ) : (
                                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingPlaylistId(playlist.id);
                                            setEditName(playlist.name);
                                        }}
                                        style={{ cursor: 'text' }}
                                        title="Click to rename"
                                    >
                                        {playlist.name}
                                    </span>
                                    {playlist.navidrome_id && (
                                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderRadius: '12px' }}>
                                            Synced
                                        </span>
                                    )}
                                </h3>
                            )}
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                                {playlist.songs?.length || 0} songs • Created {new Date(playlist.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDelete(playlist.id, e)}
                            className="delete-btn"
                            title="Delete Playlist"
                            style={{
                                padding: '0.4rem',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.color = '#fca5a5';
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>

                    {expandedPlaylistId === playlist.id && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }} onClick={(e) => e.stopPropagation()}>

                            {/* Search and Add Song Section */}
                            <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <form onSubmit={handleSearchAdd} style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Add song by title..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                        style={{ flex: 1, margin: 0 }}
                                    />
                                    <button type="submit" className="primary-btn" disabled={isSearching} style={{ width: 'auto' }}>
                                        {isSearching ? '...' : 'Search'}
                                    </button>
                                </form>

                                {searchResults.length > 0 && (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px' }}>
                                        {searchResults.map(song => (
                                            <div key={song.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                                <div>
                                                    <strong>{song.title}</strong> - <span style={{ color: 'var(--text-muted)' }}>{song.artist}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleAddSong(playlist.id, song)}
                                                    style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {playlist.songs && playlist.songs.map((song, idx) => (
                                    <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <SongCard song={song} index={idx} isSelectable={false} />
                                        </div>
                                        <button
                                            onClick={(e) => handleRemoveSong(playlist.id, song.id, e)}
                                            title="Remove Song"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                borderRadius: '50%',
                                                padding: '0.4rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.color = '#ef4444';
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.color = 'var(--text-muted)';
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default MyPlaylists;
