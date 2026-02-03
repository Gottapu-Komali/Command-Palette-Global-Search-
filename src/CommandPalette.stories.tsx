import type { Meta, StoryObj } from '@storybook/react';
import { CommandPalette } from './CommandPalette';
import { CommandPaletteProvider, useCommandPaletteContext } from './CommandPaletteProvider';
import { useEffect } from 'react';
import './index.css';

const meta: Meta<typeof CommandPalette> = {
    title: 'System/CommandPalette',
    component: CommandPalette,
    parameters: {
        layout: 'fullscreen',
        a11y: {
            element: '#storybook-root',
        },
    },
    decorators: [
        (Story) => (
            <CommandPaletteProvider>
                <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Command Palette Workspace</h1>
                        <p className="text-brand-text-secondary">Global Shortcut: <kbd className="bg-brand-surface px-2 py-1 rounded border border-brand-border">Ctrl + K</kbd></p>
                        <Story />
                    </div>
                </div>
            </CommandPaletteProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

const CommandLoader = ({ count = 5, async = false, fail = false }: { count?: number, async?: boolean, fail?: boolean }) => {
    const { registerPlugin } = useCommandPaletteContext();

    useEffect(() => {
        const commands = Array.from({ length: count }, (_, i) => ({
            id: `cmd-${i}`,
            title: `${async ? 'Async' : ''} Command ${i}`,
            description: `This is a ${fail ? 'failing' : 'standard'} command description for index ${i}`,
            action: async () => {
                if (async) await new Promise(r => setTimeout(r, 1000));
                if (fail) throw new Error('Simulated command failure');
                alert(`Executed command ${i}`);
            },
            shortcut: i === 0 ? ['mod', 's'] : undefined
        }));

        registerPlugin({
            name: async ? 'External API' : 'Core System',
            commands
        });
    }, [registerPlugin, count, async, fail]);

    return null;
};

// 1. Standard Usage (Happy Path)
export const Default: Story = {
    render: () => (
        <>
            <CommandLoader />
            <CommandPalette />
        </>
    )
};

// 2. Bulk/Performance Test (Edge Case)
export const PerformanceBulk: Story = {
    name: 'Performance: 1000 Commands',
    render: () => (
        <>
            <CommandLoader count={1000} />
            <CommandPalette />
        </>
    )
};

// 3. Parameterized Commands
export const Parameterized: Story = {
    render: () => {
        const { registerPlugin } = useCommandPaletteContext();
        useEffect(() => {
            registerPlugin({
                name: 'Settings',
                commands: [{
                    id: 'set-bg',
                    title: 'Change Profile Name',
                    parameters: [{ id: 'name', label: 'New Display Name', type: 'text' }],
                    action: (args) => alert(`Name changed to: ${args?.name}`)
                }]
            });
        }, [registerPlugin]);

        return <CommandPalette />;
    }
};

// 4. Loading States (Async Commands)
export const AsyncLoading: Story = {
    render: () => (
        <>
            <CommandLoader async={true} />
            <CommandPalette />
        </>
    )
};

// 5. Failure States
export const FailureState: Story = {
    render: () => (
        <>
            <CommandLoader fail={true} />
            <CommandPalette />
        </>
    )
};

// 6. High Contrast Simulation
export const HighContrast: Story = {
    decorators: [
        (Story) => (
            <div className="forced-colors-active" style={{ forcedColorAdjust: 'none' }}>
                <style>{`
          .forced-colors-active {
            --palette-bg: 0 0 0 !important;
            --palette-text-primary: 255 255 255 !important;
            --palette-border: 255 255 255 !important;
            --palette-accent: 255 255 0 !important;
          }
        `}</style>
                <Story />
            </div>
        )
    ],
    render: () => (
        <>
            <CommandLoader />
            <CommandPalette />
        </>
    )
};

// 7. No Results (Edge Case)
export const NoResults: Story = {
    render: () => (
        <>
            <CommandPalette />
        </>
    )
};
