import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SongSelector from '../src/components/SongSelector';

describe('SongSelector', () => {
    it('renders search input and button', () => {
        render(<SongSelector onSearch={() => { }} onSelect={() => { }} />);
        expect(screen.getByPlaceholderText(/Search for a seed song/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
    });

    it('calls onSearch when search button is clicked with input', () => {
        const handleSearch = vi.fn();
        render(<SongSelector onSearch={handleSearch} onSelect={() => { }} />);

        const input = screen.getByPlaceholderText(/Search for a seed song/i);
        const button = screen.getByRole('button', { name: /Search/i });

        fireEvent.change(input, { target: { value: 'test song' } });
        fireEvent.click(button);

        expect(handleSearch).toHaveBeenCalledWith('test song');
    });

    it('displays search results and handles selection', () => {
        const handleSelect = vi.fn();
        const mockResults = [
            { id: '1', title: 'Song 1', artist: 'Artist 1' },
            { id: '2', title: 'Song 2', artist: 'Artist 2' }
        ];

        render(<SongSelector onSearch={() => { }} onSelect={handleSelect} searchResults={mockResults} />);

        expect(screen.getByText('Song 1')).toBeInTheDocument();
        expect(screen.getByText('Artist 2')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Song 1'));
        expect(handleSelect).toHaveBeenCalledWith(mockResults[0]);
    });

    it('renders load more button if hasMore is true and calls onLoadMore', () => {
        const handleLoadMore = vi.fn();
        const mockResults = [
            { id: '1', title: 'Song 1', artist: 'Artist 1' }
        ];

        render(<SongSelector onSearch={() => { }} onSelect={() => { }} searchResults={mockResults} hasMore={true} onLoadMore={handleLoadMore} />);

        const loadMoreButton = screen.getByRole('button', { name: /Load More Results/i });
        expect(loadMoreButton).toBeInTheDocument();

        fireEvent.click(loadMoreButton);
        expect(handleLoadMore).toHaveBeenCalled();
    });
});
