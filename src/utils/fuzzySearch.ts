import type { Command, SearchResult } from '../types';

/**
 * Custom deterministic fuzzy search algorithm.
 * 
 * Logic:
 * 1. Convert query and target to lowercase.
 * 2. Find subsequence matches.
 * 3. Calculate score based on:
 *    - Consecutive character bonuses.
 *    - Starting character bonuses (beginning of words).
 *    - Penalties for gaps between matches.
 *    - Accuracy (percentage of characters matched).
 */
export function fuzzySearch(query: string, commands: Command[]): SearchResult[] {
    if (!query) {
        return commands.map((command) => ({
            command,
            score: 0,
            matches: [],
        }));
    }

    const normalizedQuery = query.toLowerCase();

    const results: SearchResult[] = commands
        .map((command) => {
            const score = calculateScore(normalizedQuery, command);
            return {
                command,
                score: score.total,
                matches: score.matches,
            };
        })
        .filter((result) => result.score > 0);

    // Deterministic sort: Primary by score, secondary by title alphabetical
    return results.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.command.title.localeCompare(b.command.title);
    });
}

interface ScoreResult {
    total: number;
    matches: number[][];
}

function calculateScore(query: string, command: Command): ScoreResult {
    const target = (command.title + ' ' + (command.description || '') + ' ' + (command.keywords?.join(' ') || '')).toLowerCase();
    const title = command.title.toLowerCase();

    // We'll primarily score the title, but search in description/keywords too
    const titleScore = getMatchScore(query, title);
    const fullScore = getMatchScore(query, target);

    // Bonus for title matches over description/keywords
    return {
        total: titleScore.total * 2 + fullScore.total,
        matches: titleScore.matches, // We only highlight title matches for simplicity in UI
    };
}

function getMatchScore(query: string, target: string): ScoreResult {
    let queryIdx = 0;
    let targetIdx = 0;
    let totalScore = 0;
    const matches: number[][] = [];

    let currentMatchStart = -1;
    let lastMatchIdx = -2;

    while (targetIdx < target.length && queryIdx < query.length) {
        if (target[targetIdx] === query[queryIdx]) {
            // Bonus: Beginning of word
            if (targetIdx === 0 || target[targetIdx - 1] === ' ') {
                totalScore += 10;
            }

            // Bonus: Consecutive characters
            if (targetIdx === lastMatchIdx + 1) {
                totalScore += 5;
            }

            // Record match for highlighting
            if (currentMatchStart === -1) {
                currentMatchStart = targetIdx;
            }

            totalScore += 1;
            lastMatchIdx = targetIdx;
            queryIdx++;
        } else {
            if (currentMatchStart !== -1) {
                matches.push([currentMatchStart, targetIdx]);
                currentMatchStart = -1;
            }
        }
        targetIdx++;
    }

    if (currentMatchStart !== -1) {
        matches.push([currentMatchStart, targetIdx]);
    }

    // If we didn't match the whole query, score is 0
    if (queryIdx < query.length) {
        return { total: 0, matches: [] };
    }

    // Penalty for spread (distance between first and last match)
    const spread = targetIdx - (matches[0]?.[0] ?? 0) + 1;
    const coverage = query.length / spread;
    totalScore *= coverage;

    // Final adjustment for absolute start position (smaller is better)
    const startPos = matches[0]?.[0] ?? 0;
    totalScore += (10 / (startPos + 1));

    return {
        total: totalScore,
        matches,
    };
}
