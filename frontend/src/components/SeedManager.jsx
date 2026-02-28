import React from 'react';

function SeedManager({
    selectedSeeds,
    onRemoveSeed,
    targetSize,
    onTargetSizeChange,
    onGenerate,
    isGenerating
}) {
    if (selectedSeeds.length === 0) return null;

    return (
        <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Selected Seeds ({selectedSeeds.length})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedSeeds.map(seed => (
                    <div key={seed.id} style={{ padding: '0.5rem 1rem', background: 'var(--accent-color)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                        <span>{seed.title}</span>
                        <button
                            onClick={() => onRemoveSeed(seed.id)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', lineHeight: 1, transition: 'color 0.2s ease' }}
                            onMouseOver={(e) => e.target.style.color = 'white'}
                            onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
                            aria-label={`Remove ${seed.title}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                    Target Size:
                    <input
                        type="number"
                        value={targetSize}
                        onChange={(e) => onTargetSizeChange(Number(e.target.value))}
                        min={selectedSeeds.length}
                        max={100}
                        style={{ width: '70px', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1rem', outline: 'none' }}
                    />
                </label>
                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(to right, #8b5cf6, #d946ef)', color: 'white', fontWeight: 'bold', cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.7 : 1, transition: 'transform 0.1s ease', boxShadow: '0 4px 15px var(--accent-glow)' }}
                    onMouseDown={(e) => !isGenerating && (e.target.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => !isGenerating && (e.target.style.transform = 'scale(1)')}
                >
                    {isGenerating ? 'Generating...' : 'Generate Playlist'}
                </button>
            </div>
        </div>
    );
}

export default SeedManager;
