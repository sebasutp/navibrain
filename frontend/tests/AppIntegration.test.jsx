import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

// Mock the global fetch
global.fetch = vi.fn();

describe('App Integration', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('performs full user flow: search -> select -> generate -> sync', async () => {
        // 1. Mock search response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 's1', title: 'Seed Song', artist: 'Seed Artist' }]
        });

        render(<App />);

        // Search
        const searchInput = screen.getByPlaceholderText(/Search for a seed song/i);
        fireEvent.change(searchInput, { target: { value: 'seed' } });
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));

        expect(screen.getByText('Searching...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Seed Song')).toBeInTheDocument();
        });

        // 2. Mock generation response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                name: 'Playlist based on Seed Song',
                navidrome_id: null,
                songs: [{ id: 'r1', title: 'Rec Song 1', artist: 'Rec Artist 1' }]
            })
        });

        // Select Seed
        fireEvent.click(screen.getByText('Seed Song'));

        // Click Generate
        fireEvent.click(screen.getByRole('button', { name: /Generate Playlist/i }));

        expect(screen.getByText(/Generating your dynamic playlist/i)).toBeInTheDocument();
        expect(screen.getByText(/Analyzing 1 seed/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Playlist based on Seed Song')).toBeInTheDocument();
            expect(screen.getByText('Rec Song 1')).toBeInTheDocument();
        });

        // 3. Mock sync response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                name: 'Playlist based on Seed Song',
                navidrome_id: 'nav-123',
                songs: [{ id: 'r1', title: 'Rec Song 1', artist: 'Rec Artist 1' }]
            })
        });

        // Sync to Navidrome
        const syncBtn = screen.getByRole('button', { name: /Sync to Navidrome/i });
        fireEvent.click(syncBtn);

        expect(screen.getByText('Syncing...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Synced to Navidrome/i })).toBeDisabled();
        });
    });

    it('handles search errors gracefully', async () => {
        fetch.mockRejectedValueOnce(new Error('Network Error'));
        render(<App />);

        const searchInput = screen.getByPlaceholderText(/Search for a seed song/i);
        fireEvent.change(searchInput, { target: { value: 'error query' } });
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));

        await waitFor(() => {
            expect(screen.getByText('Network Error')).toBeInTheDocument();
        });
    });
});
