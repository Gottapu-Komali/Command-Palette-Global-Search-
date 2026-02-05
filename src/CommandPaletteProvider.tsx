import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode, FC } from 'react';
import type { Command, Plugin } from './types';

interface CommandPaletteContextType {
    commands: Command[];
    registerPlugin: (plugin: Plugin) => void;
    unregisterPlugin: (pluginName: string) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export const CommandPaletteProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [plugins, setPlugins] = useState<Record<string, Plugin>>({});

    const registerPlugin = useCallback((plugin: Plugin) => {
        setPlugins((prev) => ({
            ...prev,
            [plugin.name]: plugin,
        }));
    }, []);

    const unregisterPlugin = useCallback((pluginName: string) => {
        setPlugins((prev) => {
            const { [pluginName]: _, ...rest } = prev;
            return rest;
        });
    }, []);

    const allCommands = Object.values(plugins).flatMap((p) => p.commands);

    return (
        <CommandPaletteContext.Provider value={{ commands: allCommands, registerPlugin, unregisterPlugin }}>
            {children}
        </CommandPaletteContext.Provider>
    );
};

export const useCommandPaletteContext = () => {
    const context = useContext(CommandPaletteContext);
    if (!context) {
        throw new Error('useCommandPaletteContext must be used within a CommandPaletteProvider');
    }
    return context;
};
