// src/icons/Icon.jsx
// Universal icon wrapper that renders the correct style variant

import React from 'react';
import { useIconStore, ICON_STYLES } from './iconStore.js';

// Import icon libraries (we'll add these as we create them)
import * as LineIcons from './library/line/index.js';
import * as FilledIcons from './library/filled/index.js';
import * as GlowIcons from './library/glow/index.js';

const STYLE_LIBRARIES = {
    [ICON_STYLES.LINE]: LineIcons,
    [ICON_STYLES.FILLED]: FilledIcons,
    [ICON_STYLES.GLOW]: GlowIcons
};

// Convert icon name to PascalCase component name
function toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function Icon({
    name,
    size = 24,
    color = 'currentColor',
    style: overrideStyle,
    className = ''
}) {
    const globalStyle = useIconStore(state => state.style);
    const activeStyle = overrideStyle || globalStyle;

    const library = STYLE_LIBRARIES[activeStyle];
    const componentName = toPascalCase(name);
    const IconComponent = library?.[componentName];

    if (!IconComponent) {
        // Fallback: render a placeholder circle if icon not found
        return (
            <span
                className={className}
                style={{
                    display: 'inline-flex',
                    width: size,
                    height: size,
                    alignItems: 'center',
                    justifyContent: 'center',
                    color,
                    opacity: 0.5
                }}
            >
                ○
            </span>
        );
    }

    return (
        <IconComponent
            size={size}
            color={color}
            className={className}
        />
    );
}

// Export style toggle component for dev panel
export function IconStyleToggle() {
    const { style, setStyle } = useIconStore();

    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="opacity-60">Icons:</span>
            {Object.values(ICON_STYLES).map(s => (
                <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`px-2 py-1 rounded capitalize transition-all ${style === s
                            ? 'bg-white/20 text-white'
                            : 'text-white/50 hover:text-white/80'
                        }`}
                >
                    {s}
                </button>
            ))}
        </div>
    );
}
