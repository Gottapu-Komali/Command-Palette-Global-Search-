import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from './CommandPalette';
import { CommandPaletteProvider, useCommandPaletteContext } from './CommandPaletteProvider';
import { describe, it, expect, vi } from 'vitest';
import { useEffect } from 'react';

const MockApp = ({ commands }: { commands: any[] }) => {
    const { registerPlugin } = useCommandPaletteContext();
    useEffect(() => {
        registerPlugin({ name: 'Test', commands });
    }, [registerPlugin]);
    return <CommandPalette />;
};

describe('CommandPalette Interaction', () => {
    const commands = [
        { id: '1', title: 'Action One', action: vi.fn() },
        { id: '2', title: 'Action Two', action: vi.fn() },
    ];

    it('opens on Ctrl+K', async () => {
        render(
            <CommandPaletteProvider>
                <MockApp commands={commands} />
            </CommandPaletteProvider>
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search/i)).toHaveFocus();
    });

    it('navigates with arrow keys', async () => {
        const user = userEvent.setup();
        render(
            <CommandPaletteProvider>
                <MockApp commands={commands} />
            </CommandPaletteProvider>
        );

        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

        const input = screen.getByPlaceholderText(/search/i);
        await user.type(input, 'Action');

        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveAttribute('aria-selected', 'true');

        await user.keyboard('{ArrowDown}');
        expect(options[1]).toHaveAttribute('aria-selected', 'true');

        await user.keyboard('{ArrowUp}');
        expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('executes command on Enter', async () => {
        const user = userEvent.setup();
        render(
            <CommandPaletteProvider>
                <MockApp commands={commands} />
            </CommandPaletteProvider>
        );

        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        await user.keyboard('{Enter}');

        expect(commands[0]?.action).toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes on Escape', async () => {
        const user = userEvent.setup();
        render(
            <CommandPaletteProvider>
                <MockApp commands={commands} />
            </CommandPaletteProvider>
        );

        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
