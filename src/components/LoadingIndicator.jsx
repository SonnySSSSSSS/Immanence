// src/components/LoadingIndicator.jsx
// Phase 5: Loading states with accessibility

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore';

export function LoadingIndicator({ message = 'Loading...', size = 'medium' }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';

    const sizeMap = { small: 24, medium: 40, large: 60 };
    const spinnerSize = sizeMap[size] || sizeMap.medium;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                padding: '24px'
            }}
        >
            <div
                style={{
                    width: spinnerSize,
                    height: spinnerSize,
                    border: `3px solid ${accentColor}30`,
                    borderTop: `3px solid ${accentColor}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}
            />
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            {message && (
                <span style={{ fontSize: '14px', color: textColor, opacity: 0.7 }}>
                    {message}
                </span>
            )}
        </div>
    );
}

export function LoadingOverlay({ isVisible, message = 'Loading...' }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    if (!isVisible) return null;

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.95)' : 'rgba(10, 15, 25, 0.95)';

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999998,
                backgroundColor: `${bgColor}dd`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <LoadingIndicator message={message} size="large" />
        </div>
    );
}

export default LoadingIndicator;