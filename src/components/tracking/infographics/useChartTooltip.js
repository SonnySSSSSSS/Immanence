import { useState, useCallback } from 'react';

/**
 * Hook for managing tooltip state in chart components.
 * Returns tooltip props and event handlers.
 */
export function useChartTooltip() {
    const [tooltip, setTooltip] = useState({
        visible: false,
        x: 0,
        y: 0,
        value: '',
        label: '',
        sublabel: ''
    });

    const showTooltip = useCallback((e, value, label, sublabel) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const parentRect = e.currentTarget.closest('[data-tooltip-container]')?.getBoundingClientRect() || rect;

        setTooltip({
            visible: true,
            x: e.clientX - parentRect.left,
            y: e.clientY - parentRect.top,
            value,
            label,
            sublabel
        });
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);

    const moveTooltip = useCallback((e) => {
        const parentRect = e.currentTarget.closest('[data-tooltip-container]')?.getBoundingClientRect();
        if (parentRect) {
            setTooltip(prev => ({
                ...prev,
                x: e.clientX - parentRect.left,
                y: e.clientY - parentRect.top
            }));
        }
    }, []);

    return {
        tooltipProps: tooltip,
        showTooltip,
        hideTooltip,
        moveTooltip
    };
}

export default useChartTooltip;
