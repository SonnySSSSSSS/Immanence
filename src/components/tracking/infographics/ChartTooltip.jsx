import React from 'react';
import { TOOLTIP_STYLES, ANIM } from './tokens';

/**
 * Shared tooltip component for all infographic charts.
 * Positioned above cursor with arrow pointing down.
 */
export function ChartTooltip({
    value,
    label,
    sublabel,
    visible = false,
    x = 0,
    y = 0
}) {
    if (!visible) return null;

    // Calculate position relative to container
    const style = {
        position: 'absolute',
        left: x,
        top: y - 8, // Position above cursor
        transform: 'translate(-50%, -100%)',
        background: TOOLTIP_STYLES.bg,
        color: TOOLTIP_STYLES.text,
        fontSize: `${TOOLTIP_STYLES.fontSize}px`,
        padding: `${TOOLTIP_STYLES.padding}px ${TOOLTIP_STYLES.padding * 2}px`,
        borderRadius: `${TOOLTIP_STYLES.borderRadius}px`,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 50,
        opacity: visible ? 1 : 0,
        transition: `opacity ${ANIM.hover}ms ease`
    };

    const arrowStyle = {
        position: 'absolute',
        left: '50%',
        bottom: -4,
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent',
        borderTop: `4px solid ${TOOLTIP_STYLES.bg}`
    };

    return (
        <div style={style}>
            <div style={{ fontWeight: 600 }}>{value}</div>
            {label && (
                <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '2px' }}>
                    {label}
                </div>
            )}
            {sublabel && (
                <div style={{ opacity: 0.5, fontSize: '9px', marginTop: '1px' }}>
                    {sublabel}
                </div>
            )}
            <div style={arrowStyle} />
        </div>
    );
}

export default ChartTooltip;
