// src/components/PathBadges.jsx
// Complementary path symbols displayed above/around the avatar

import React from 'react';
import { PATH_SYMBOLS, PATH_NAMES } from '../state/pathStore';
import { useLunarStore } from '../state/lunarStore';

/**
 * PathBadges — Shows up to 2 secondary path symbols
 * 
 * These appear when a user has secondary paths above 20% threshold.
 * The symbols are positioned above the avatar.
 */
export function PathBadges({ paths = [], size = 'normal' }) {
    const stage = useLunarStore(s => s.getCurrentStage());
    const stageLower = (stage || 'seedling').toLowerCase();

    if (!paths || paths.length === 0) {
        return null;
    }

    if (stageLower === 'seedling') {
        return null;
    }

    // Only show up to 2 complementary paths
    const displayPaths = paths.slice(0, 2);

    const badgeSize = size === 'small' ? '1.25rem' : '1.5rem';
    const gap = size === 'small' ? '0.75rem' : '1rem';

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                gap,
                marginBottom: '0.5rem',
            }}
        >
            {displayPaths.map(path => (
                <div
                    key={path}
                    title={`${PATH_NAMES[path]} Path`}
                    style={{
                        fontSize: badgeSize,
                        opacity: 0.6,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        cursor: 'default',
                    }}
                    onMouseEnter={e => {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={e => {
                        e.target.style.opacity = '0.6';
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    {PATH_SYMBOLS[path] || '○'}
                </div>
            ))}
        </div>
    );
}

/**
 * PathSymbol — Single path symbol display
 * Used for showing the current path in the UI
 */
export function PathSymbol({ path, size = 'normal', showLabel = false }) {
    if (!path) return null;

    const symbol = PATH_SYMBOLS[path] || '○';
    const name = PATH_NAMES[path] || path;

    const fontSize = size === 'small' ? '1rem' : size === 'large' ? '2rem' : '1.5rem';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
            }}
            title={`${name} Path`}
        >
            <span style={{ fontSize }}>{symbol}</span>
            {showLabel && (
                <span
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                    }}
                >
                    {name}
                </span>
            )}
        </div>
    );
}

export default PathBadges;
