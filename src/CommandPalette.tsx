import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { fuzzySearch } from './utils/fuzzySearch';
import { useCommandPaletteContext } from './CommandPaletteProvider';
import type { Command, SearchResult } from './types';

/**
 * CommandPalette Component
 * 
 * Architecture:
 * - Uses a Portal to render at body root for zero overflow issues.
 * - Implements a manual focus trap for accessibility.
 * - Uses a custom fuzzy search algorithm with deterministic ranking.
 */
export const CommandPalette: React.FC = () => {
    const { commands } = useCommandPaletteContext();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeCommand, setActiveCommand] = useState<Command | null>(null);
    const [perf, setPerf] = useState(0);
    const [isExecuting, setIsExecuting] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastFocusedElement = useRef<HTMLElement | null>(null);

    // Intentional Memoization: Heavy fuzzy search logic is cached until commands or query change.
    // This ensures 50ms latency target is met even with large command sets.
    const searchResults = useMemo((): SearchResult[] => {
        if (activeCommand || !isOpen) return [];
        const start = performance.now();
        const results = fuzzySearch(query, commands);
        setPerf(performance.now() - start);
        return results;
    }, [query, commands, activeCommand, isOpen]);

    // Reset index when query changes to prevent out-of-bounds selection
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Global Keybind (Cmd+K)
    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleGlobalKey);
        return () => window.removeEventListener('keydown', handleGlobalKey);
    }, []);

    // Handlers for focus management and state cleanup
    useEffect(() => {
        if (isOpen) {
            lastFocusedElement.current = document.activeElement as HTMLElement;
            inputRef.current?.focus();
            document.body.style.overflow = 'hidden'; // Prevent scroll leakage
        } else {
            setQuery('');
            setActiveCommand(null);
            document.body.style.overflow = '';
            lastFocusedElement.current?.focus(); // Restore focus
        }
    }, [isOpen]);

    // Manual Focus Trap Logic
    const handleContainerKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault(); // Lock focus inside search input
            inputRef.current?.focus();
        }
        if (e.key === 'Escape') {
            if (activeCommand) {
                setActiveCommand(null);
                setQuery('');
            } else {
                setIsOpen(false);
            }
        }
    };

    const navigate = useCallback((direction: 'up' | 'down') => {
        if (searchResults.length === 0) return;
        setSelectedIndex(prev => {
            if (direction === 'down') return (prev + 1) % searchResults.length;
            return (prev - 1 + searchResults.length) % searchResults.length;
        });
    }, [searchResults]);

    const onExecute = async () => {
        setIsExecuting(true);
        try {
            if (activeCommand && activeCommand.parameters?.[0]) {
                // Parameter submission
                await activeCommand.action({ [activeCommand.parameters[0].id]: query });
                setIsOpen(false);
            } else {
                const selected = searchResults[selectedIndex];
                if (selected) {
                    if (selected.command.parameters?.length) {
                        setActiveCommand(selected.command);
                        setQuery('');
                    } else {
                        await selected.command.action();
                        setIsOpen(false);
                    }
                }
            }
        } catch (err) {
            console.error('Command failed:', err);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                navigate('down');
                break;
            case 'ArrowUp':
                e.preventDefault();
                navigate('up');
                break;
            case 'Enter':
                e.preventDefault();
                onExecute();
                break;
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-zinc-900/60 backdrop-blur-sm p-4 animate-in"
            onKeyDown={handleContainerKeyDown}
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
        >
            <div
                className="w-full max-w-2xl bg-brand-surface border border-brand-border rounded-token-lg shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Header */}
                <div className="flex items-center px-4 py-4 border-b border-brand-border">
                    {activeCommand && (
                        <div className="flex items-center bg-brand-accent/10 py-1 px-2 rounded-token-sm mr-2 text-brand-accent text-xs font-bold border border-brand-accent/20">
                            {activeCommand.title}
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-lg text-brand-text-primary placeholder-brand-text-secondary"
                        placeholder={(activeCommand && activeCommand.parameters?.[0]) ? `Enter ${activeCommand.parameters[0].label}...` : "Search commands..."}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        aria-autocomplete="list"
                        aria-controls="palette-results"
                        aria-activedescendant={activeCommand ? undefined : `result-${selectedIndex}`}
                    />
                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-text-secondary uppercase tracking-tight">
                        <span>{perf.toFixed(2)}ms</span>
                        <kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">ESC</kbd>
                    </div>
                    {isExecuting && (
                        <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-brand-accent border-t-transparent" />
                    )}
                </div>

                {/* Results Body */}
                <div
                    id="palette-results"
                    role="listbox"
                    className="max-h-[50vh] overflow-y-auto p-2"
                >
                    {!activeCommand && searchResults.length > 0 ? (
                        searchResults.map((result, idx) => (
                            <div
                                key={result.command.id}
                                id={`result-${idx}`}
                                role="option"
                                aria-selected={idx === selectedIndex}
                                className={`
                  flex items-center px-4 py-3 rounded-token-md cursor-pointer transition-colors
                  ${idx === selectedIndex
                                        ? 'bg-brand-accent text-white shadow-lg'
                                        : 'text-brand-text-primary hover:bg-brand-bg'}
                `}
                                onMouseMove={() => setSelectedIndex(idx)}
                                onClick={onExecute}
                            >
                                <div className={`mr-4 ${idx === selectedIndex ? 'text-white' : 'text-brand-text-secondary'}`}>
                                    {result.command.icon || <DefaultIcon />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold truncate">
                                        {highlightText(result.command.title, result.matches, idx === selectedIndex)}
                                    </div>
                                    {result.command.description && (
                                        <div className={`text-xs truncate ${idx === selectedIndex ? 'text-blue-100' : 'text-brand-text-secondary'}`}>
                                            {result.command.description}
                                        </div>
                                    )}
                                </div>
                                {result.command.shortcut && (
                                    <div className="flex gap-1 ml-4">
                                        {result.command.shortcut.map(key => (
                                            <kbd key={key} className={`px-1 rounded border text-[10px] uppercase font-bold ${idx === selectedIndex ? 'bg-white/20 border-white/30' : 'bg-brand-bg border-brand-border'}`}>
                                                {key === 'mod' ? 'Ctrl' : key}
                                            </kbd>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (activeCommand && activeCommand.parameters?.[0]) ? (
                        <div className="p-12 text-center text-brand-text-secondary">
                            <div className="text-brand-accent mb-2">
                                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="font-bold text-brand-text-primary">Action required</p>
                            <p className="text-sm">Please enter the {activeCommand.parameters[0].label.toLowerCase()}</p>
                        </div>
                    ) : query && (
                        <div className="py-12 text-center text-brand-text-secondary">
                            No results found for "{query}"
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-brand-bg/50 border-t border-brand-border flex items-center justify-between text-[11px] font-bold text-brand-text-secondary uppercase">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><kbd className="bg-brand-surface p-1 rounded border border-brand-border">↑↓</kbd> Navigate</span>
                        <span className="flex items-center gap-1"><kbd className="bg-brand-surface p-1 rounded border border-brand-border">↵</kbd> Execute</span>
                    </div>
                    <div className="tracking-widest opacity-50">Strict Mode v1.1</div>
                </div>
            </div>
        </div>,
        document.body
    );
};

function highlightText(text: string, matches: number[][], selected: boolean) {
    if (!matches.length) return text;
    const parts: React.ReactNode[] = [];
    let last = 0;
    matches.forEach((match, i) => {
        const start = match[0];
        const end = match[1];
        if (start === undefined || end === undefined) return;

        if (start > last) parts.push(text.slice(last, start));
        parts.push(
            <span key={i} className={selected ? 'underline font-black' : 'text-brand-accent font-black'}>
                {text.slice(start, end)}
            </span>
        );
        last = end;
    });
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

const DefaultIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
