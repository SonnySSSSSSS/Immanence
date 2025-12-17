// src/components/ui/PeripheralHalo.jsx
// Subtle halo pulse affordance for collapsible sections
// Communicates "this is available, but not demanding"

import React, { useEffect, useRef } from 'react';

/**
 * Peripheral Halo Pulse - subtle expansion ring to indicate affordance
 * 
 * @param {boolean} isExpanded - Whether the associated section is expanded
 * @param {boolean} isHovered - Whether the associated element is hovered
 * @param {number} phaseOffset - Stagger offset in ms (for multiple halos)
 */
export function PeripheralHalo({ isExpanded = false, isHovered = false, phaseOffset = 0 }) {
    const haloRef = useRef(null);

    useEffect(() => {
        if (!haloRef.current) return;

        // Stop pulsing when expanded or hovered
        if (isExpanded || isHovered) {
            haloRef.current.style.animation = 'none';
            if (isHovered) {
                // Hold slightly brighter static halo on hover
                haloRef.current.style.opacity = '0.5';
                haloRef.current.style.transform = 'scale(1)';
            } else if (isExpanded) {
                // Collapse inward when expanded
                haloRef.current.style.opacity = '0';
                haloRef.current.style.transform = 'scale(0.95)';
            }
            return;
        }

        // Resume pulsing - staggered by phase offset
        haloRef.current.style.animation = `halo-pulse 3.2s ease-in-out ${phaseOffset}ms infinite`;
    }, [isExpanded, isHovered, phaseOffset]);

    return (
        <>
            <div
                ref={haloRef}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    width: 'calc(100% + 16px)',
                    height: 'calc(100% + 16px)',
                    left: '-8px',
                    top: '-8px',
                    border: '1.5px solid var(--accent-color)',
                    filter: 'blur(3px) saturate(0.35) brightness(0.6)', // Desaturated 65%, lower brightness
                    opacity: 0.25, // Increased for visibility
                    mixBlendMode: 'screen', // Light, not ink
                    animation: `halo-pulse 3.2s ease-in-out ${phaseOffset}ms infinite`,
                    transformOrigin: 'center',
                }}
            />

            <style>{`
        @keyframes halo-pulse {
          0% {
            transform: scale(1);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.4;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
        </>
    );
}

export default PeripheralHalo;
