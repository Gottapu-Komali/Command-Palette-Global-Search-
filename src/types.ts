import { ReactNode } from 'react';

export interface CommandParameter {
    id: string;
    label: string;
    type: 'text' | 'number' | 'select';
    options?: { label: string; value: string }[];
    required?: boolean;
}

export interface Command {
    id: string;
    title: string;
    description?: string;
    keywords?: string[];
    icon?: ReactNode;
    category?: string;
    shortcut?: string[]; // e.g. ['mod', 'k']
    action: (args?: Record<string, any>) => void | Promise<void>;
    parameters?: CommandParameter[];
}

export interface SearchResult {
    command: Command;
    score: number;
    matches: number[][]; // [start, end] pairs for highlighting
}

export interface Plugin {
    name: string;
    commands: Command[];
}
