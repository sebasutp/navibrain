import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('App Layout', () => {
    it('renders the main Navibrain title', () => {
        render(<App />);
        expect(screen.getByText(/Navibrain/i)).toBeInTheDocument();
    });

    it('renders the Generator tab initially', () => {
        render(<App />);
        expect(screen.getByRole('button', { name: /Generator/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /My Playlists/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search for a seed song/i)).toBeInTheDocument();
    });
});
