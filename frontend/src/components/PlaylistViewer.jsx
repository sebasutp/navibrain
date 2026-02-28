import React from 'react';
import SongCard from './SongCard';

function PlaylistViewer({ playlist, onSync, isSyncing }) {
    if (!playlist) return null;

    return (
        <div className="playlist-viewer animate-fade-in" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{playlist.name}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                        {playlist.songs.length} generated songs
                    </p>
                </div>

                <button
                    onClick={onSync}
                    disabled={isSyncing || !!playlist.navidrome_id}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: playlist.navidrome_id ? 'rgba(34, 197, 94, 0.2)' : 'linear-gradient(to right, #8b5cf6, #d946ef)',
                        color: playlist.navidrome_id ? '#4ade80' : 'white',
                        fontWeight: '600',
                        cursor: playlist.navidrome_id || isSyncing ? 'default' : 'pointer',
                        opacity: isSyncing ? 0.7 : 1,
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {playlist.navidrome_id
                        ? '✓ Synced to Navidrome'
                        : isSyncing
                            ? 'Syncing...'
                            : 'Sync to Navidrome'}
                </button>
            </div>

            <div className="song-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                {playlist.songs.map((song, index) => (
                    <SongCard key={song.id} song={song} index={index} />
                ))}
            </div>
        </div>
    );
}

export default PlaylistViewer;
