import React, { useState, useEffect } from 'react';
import SongCard from './SongCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function MyPlaylists() {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedPlaylistId, setExpandedPlaylistId] = useState(null);

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
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {playlist.name}
                                {playlist.navidrome_id && (
                                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderRadius: '12px' }}>
                                        Synced
                                    </span>
                                )}
                            </h3>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                                {playlist.songs?.length || 0} songs • Created {new Date(playlist.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDelete(playlist.id, e)}
                            className="delete-btn"
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.5)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.color = '#fca5a5';
                            }}
                        >
                            Delete
                        </button>
                    </div>

                    {expandedPlaylistId === playlist.id && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {playlist.songs && playlist.songs.map((song, idx) => (
                                    <SongCard key={song.id} song={song} index={idx} isSelectable={false} />
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
