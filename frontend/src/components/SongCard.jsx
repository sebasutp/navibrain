import React from 'react';

function SongCard({ song, index, onClick, isSelectable = false }) {
    const defaultStyles = {
        display: 'flex',
        alignItems: 'center',
        padding: isSelectable ? '1rem' : '0.75rem 1rem',
        borderRadius: '8px',
        background: isSelectable ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
        border: isSelectable ? '1px solid rgba(255,255,255,0.05)' : undefined,
        borderBottom: isSelectable ? undefined : '1px solid rgba(255,255,255,0.05)',
        cursor: isSelectable ? 'pointer' : 'default',
        transition: 'background 0.2s ease',
    };

    return (
        <div
            onClick={onClick}
            className={`song-item ${isSelectable ? 'animate-fade-in' : ''}`}
            style={defaultStyles}
            onMouseOver={isSelectable ? (e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)') : undefined}
            onMouseOut={isSelectable ? (e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)') : undefined}
        >
            {index !== undefined && index !== null && (
                <span style={{ color: 'var(--text-muted)', width: '30px', fontSize: '0.9rem' }}>
                    {index + 1}
                </span>
            )}
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: isSelectable ? 600 : 500, fontSize: isSelectable ? '1.1rem' : '1rem' }}>{song.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: isSelectable ? '0.9rem' : '0.85rem' }}>{song.artist}</div>
            </div>
            {song.duration && !isSelectable && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                </span>
            )}
        </div>
    );
}

export default SongCard;
