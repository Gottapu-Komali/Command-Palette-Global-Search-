import { describe, it, expect } from 'vitest';
import { fuzzySearch } from './fuzzySearch';
import type { Command } from '../types';

describe('Fuzzy Search Algorithm', () => {
    const mockCommands: Command[] = [
        { id: '1', title: 'Open Settings', action: () => { } },
        { id: '2', title: 'Create New Project', action: () => { } },
        { id: '3', title: 'git: commit', keywords: ['gc'], action: () => { } },
        { id: '4', title: 'git: checkout', action: () => { } },
        { id: '5', title: 'System: Restart', action: () => { } },
    ];

    it('is deterministic: same input always produces same order', () => {
        const res1 = fuzzySearch('git', mockCommands);
        const res2 = fuzzySearch('git', mockCommands);
        expect(res1).toEqual(res2);
        // "git: checkout" (4) comes before "git: commit" (3) alphabetically
        expect(res1?.[0]?.command.id).toBe('4');
    });

    it('prioritizes matches at the start of words', () => {
        // "re" matches "REstart" (start) and "cREate" (middle)
        const results = fuzzySearch('re', mockCommands);
        expect(results?.[0]?.command.title).toBe('System: Restart');
    });

    it('supports subsequence matching', () => {
        // "cnp" for "Create New Project"
        const results = fuzzySearch('cnp', mockCommands);
        expect(results?.[0]?.command.title).toBe('Create New Project');
    });

    it('scores consecutive characters higher', () => {
        const commands: Command[] = [
            { id: 'a', title: 'abc', action: () => { } },
            { id: 'b', title: 'a b c', action: () => { } },
        ];
        const results = fuzzySearch('abc', commands);
        expect(results?.[0]?.command.id).toBe('a');
    });

    it('returns empty array for no match', () => {
        const results = fuzzySearch('xyz123', mockCommands);
        expect(results).toHaveLength(0);
    });

    it('is case insensitive', () => {
        const res1 = fuzzySearch('SETTINGS', mockCommands);
        const res2 = fuzzySearch('settings', mockCommands);
        expect(res1?.[0]?.command.id).toBe(res2?.[0]?.command.id);
    });
});
