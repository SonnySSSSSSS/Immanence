// src/components/ui/PillButton.jsx
// Reusable pill button with premium effects:
// - Asymmetric inner shadow (ember core)
// - Grain texture overlay
// - Radial gradient overlay for depth
// - Press feedback micro-interaction

import React, { useRef, useCallback } from 'react';

/**
 * Premium pill button with layered visual effects
 * 
 * @param {Object} props
 * @param {React.ReactNode} children - Button content
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disabled state
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'accent'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - Additional class names
 * @param {Object} style - Additional inline styles
 * @param {boolean} fullWidth - Whether button takes full width
 */
export function PillButton({
    children,
    onClick,
    disabled = false,
    variant = 'secondary',
    size = 'md',
    className = '',
    style = {},
    fullWidth = false,
    ...props
}) {
    const buttonRef = useRef(null);

    // Press feedback handlers
    const handleMouseDown = useCallback((e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'scale(0.97)';
    }, [disabled]);

    const handleMouseUp = useCallback((e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'scale(1)';
    }, [disabled]);

    const handleMouseLeave = useCallback((e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'scale(1)';
    }, [disabled]);

    // Size presets
    const sizeStyles = {
        sm: {
            padding: '6px 16px',
            fontSize: '10px',
            height: '32px',
        },
        md: {
            padding: '10px 24px',
            fontSize: '11px',
            height: '40px',
        },
        lg: {
            padding: '12px 32px',
            fontSize: '12px',
            height: '46px',
        },
    };

    // Variant styles
    const variantStyles = {
        primary: {
            background: 'var(--accent-color)',
            color: '#0B1F16',
            border: 'none',
            boxShadow: '0 0 18px var(--accent-30), inset 3px 4px 8px rgba(0,0,0,0.25), inset -2px -3px 6px rgba(255,255,255,0.2)',
        },
        secondary: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
            color: 'var(--accent-color)',
            border: '1px solid var(--accent-30)',
            boxShadow: '0 0 20px var(--accent-08), inset 0 0 20px var(--accent-05), inset 3px 4px 8px rgba(0,0,0,0.35), inset -2px -3px 6px var(--accent-15)',
        },
        ghost: {
            background: 'transparent',
            color: 'rgba(253,251,245,0.7)',
            border: '1px solid rgba(253,251,245,0.2)',
            boxShadow: 'inset 3px 4px 8px rgba(0,0,0,0.2), inset -2px -3px 6px rgba(255,255,255,0.05)',
        },
        accent: {
            background: 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            color: '#050508',
            border: 'none',
            boxShadow: '0 0 24px var(--accent-30), inset 0 1px 0 rgba(255,255,255,0.35), inset 3px 4px 8px rgba(0,0,0,0.2), inset -2px -3px 6px rgba(255,255,255,0.15)',
        },
    };

    // Disabled styles override
    const disabledStyles = disabled ? {
        opacity: 0.5,
        cursor: 'not-allowed',
        pointerEvents: 'none',
    } : {};

    // Merge all styles
    const buttonStyle = {
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-mythic)',
        textTransform: 'uppercase',
        borderRadius: '999px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 150ms ease-out, box-shadow 200ms ease-out, background 200ms ease-out',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...disabledStyles,
        ...style,
    };

    // Grain opacity varies by variant
    const grainOpacity = variant === 'primary' || variant === 'accent' ? 0.06 : 0.08;
    const gradientOpacity = variant === 'primary' || variant === 'accent' ? 0.15 : 0.12;

    return (
        <button
            ref={buttonRef}
            onClick={onClick}
            disabled={disabled}
            className={className}
            style={buttonStyle}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {/* Content */}
            <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>

            {/* Radial gradient overlay for depth */}
            <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at 40% 30%, rgba(255,255,255,${gradientOpacity}) 0%, transparent 60%)`,
                    mixBlendMode: 'soft-light',
                    zIndex: 1,
                }}
            />

            {/* Grain texture overlay */}
            <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    opacity: grainOpacity,
                    mixBlendMode: 'overlay',
                    zIndex: 1,
                }}
            />
        </button>
    );
}

export default PillButton;
