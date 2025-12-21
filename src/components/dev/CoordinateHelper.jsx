// src/components/dev/CoordinateHelper.jsx
import React from 'react';
import { useSettingsStore } from '../../state/settingsStore';

/**
 * Generic coordinate helper wrapper.
 * When showCoordinateHelper is active, wraps children with a click-tracking overlay.
 */
export function CoordinateHelper({ children, className = "", label = "" }) {
    const showCoordinateHelper = useSettingsStore(s => s.showCoordinateHelper);

    const handleCoordClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const out = `${label ? `[${label}] ` : ''}Coordinate: { x: ${x.toFixed(1)}, y: ${y.toFixed(1)} }`;
        console.log(`🎯 ${out}`);

        // Brief visual feedback could be added here if needed
    };

    if (!showCoordinateHelper) return children;

    return (
        <div className={`relative ${className}`}>
            {children}
            <div
                className="absolute inset-0 z-[9999] cursor-crosshair bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 transition-colors group flex items-center justify-center"
                onClick={handleCoordClick}
                title={`Dev: Click to log coordinates${label ? ` for ${label}` : ''}`}
            >
                <div className="text-[8px] text-cyan-400 font-mono opacity-0 group-hover:opacity-100 bg-black/80 px-1 rounded pointer-events-none">
                    INSPECTOR {label}
                </div>
            </div>
        </div>
    );
}
