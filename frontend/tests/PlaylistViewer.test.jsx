import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlaylistViewer from '../src/components/PlaylistViewer';

describe('PlaylistViewer', () => {
    const mockPlaylist = {
        id: 1,
        name: 'My Awesome List',
        songs: [
            { id: '1', title: 'Test Song 1', artist: 'Artist 1', duration: 180 },
            { id: '2', title: 'Test Song 2', artist: 'Artist 2', duration: 200 }
        ],
        navidrome_id: null
    };

    it('renders nothing if no playlist provided', () => {
        const { container } = render(<PlaylistViewer playlist={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders playlist details and songs', () => {
        render(<PlaylistViewer playlist={mockPlaylist} />);
        expect(screen.getByText('My Awesome List')).toBeInTheDocument();
        expect(screen.getByText('2 generated songs')).toBeInTheDocument();
        expect(screen.getByText('Test Song 1')).toBeInTheDocument();
        expect(screen.getByText('3:00')).toBeInTheDocument(); // 180 seconds
    });

    it('calls onSync when sync button is clicked', () => {
        const handleSync = vi.fn();
        render(<PlaylistViewer playlist={mockPlaylist} onSync={handleSync} isSyncing={false} />);

        const button = screen.getByRole('button', { name: /Sync to Navidrome/i });
        fireEvent.click(button);
        expect(handleSync).toHaveBeenCalled();
    });

    it('disables sync button when already synced', () => {
        const syncedPlaylist = { ...mockPlaylist, navidrome_id: 'some-id' };
        render(<PlaylistViewer playlist={syncedPlaylist} onSync={() => { }} isSyncing={false} />);

        const SyncButton = screen.getByRole('button', { name: /Synced to Navidrome/i });
        expect(SyncButton).toBeDisabled();
    });
});
