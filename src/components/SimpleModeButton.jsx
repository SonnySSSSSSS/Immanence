// src/components/SimpleModeButton.jsx
// Mode button with cosmic dark mode and watercolor light mode imagery

import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useTheme } from '../context/ThemeContext.jsx';

export function SimpleModeButton({ title, onClick, icon, disabled = false }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const theme = useTheme();
    const primaryHex = theme?.accent?.primary || '#4ade80';

    // Get appropriate background image based on mode and icon
    // Using default themes: 'cosmic' for dark, 'watercolor' for light
    const getBackgroundImage = () => {
        const buttonTheme = isLight ? 'watercolor' : 'cosmic';
        const mode = isLight ? 'light' : 'dark';
        const imagePath = `${import.meta.env.BASE_URL}mode_buttons/${icon}_${buttonTheme}_${mode}.png`;
        return imagePath;
    };

    const getIcon = () => {
        switch (icon) {
            case 'practice':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(0 1)">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
                        </g>
                    </svg>
                );
            case 'wisdom':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(0 1)">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
                        </g>
                    </svg>
                );
            case 'application':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(0 1)">
                            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" fill="none" opacity="0.9" />
                            <path d="M12 3v18M19.59 7.17L4.41 16.83M19.59 16.83L4.41 7.17" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                        </g>
                    </svg>
                );
            case 'navigation':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(0 1)">
                            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" fill="none" opacity="0.9" />
                            <path d="M12 3L14 9H20L15 13L17 19L12 15L7 19L9 13L4 9H10L12 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
                        </g>
                    </svg>
                );
            default:
                return null;
        }
    };

    const handleClick = () => {
        if (disabled) return;
        if (onClick) onClick();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="group relative flex flex-col items-center gap-3"
            style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.45 : 1,
                filter: disabled ? 'grayscale(0.4)' : 'none',
            }}
            aria-label={title}
            aria-disabled={disabled}
        >
            <div
                className="relative flex items-center justify-center transition-all duration-300 overflow-hidden"
                style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    backgroundImage: `url(${getBackgroundImage()})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: isLight ? `1px solid ${primaryHex}40` : `1px solid ${primaryHex}50`,
                    boxShadow: isLight
                        ? `0 6px 18px rgba(100, 80, 60, 0.2), 0 3px 8px rgba(100, 80, 60, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.9), 0 0 15px ${primaryHex}25`
                        : `0 6px 20px rgba(0, 0, 0, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 0 20px ${primaryHex}40`,
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
                    e.currentTarget.style.borderColor = isLight ? `${primaryHex}70` : `${primaryHex}80`;
                    e.currentTarget.style.boxShadow = isLight
                        ? `0 10px 28px rgba(100, 80, 60, 0.3), 0 6px 12px rgba(100, 80, 60, 0.2), 0 0 25px ${primaryHex}40`
                        : `0 10px 32px rgba(0, 0, 0, 0.6), 0 6px 16px rgba(0, 0, 0, 0.5), 0 0 35px ${primaryHex}60`;
                }}
                onMouseLeave={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.borderColor = isLight ? `${primaryHex}40` : `${primaryHex}50`;
                    e.currentTarget.style.boxShadow = isLight
                        ? `0 6px 18px rgba(100, 80, 60, 0.2), 0 3px 8px rgba(100, 80, 60, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.9), 0 0 15px ${primaryHex}25`
                        : `0 6px 20px rgba(0, 0, 0, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 0 20px ${primaryHex}40`;
                }}
            >
                {/* Dark overlay for text legibility (dark mode only) */}
                {!isLight && (
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.3) 70%)',
                        }}
                    />
                )}
                {/* Light overlay for glassmorphism (light mode only) */}
                {isLight && (
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, transparent 30%, rgba(255,255,255,0.15) 70%)',
                        }}
                    />
                )}
                {getIcon()}
            </div>
            <span
                className="type-label font-bold"
                style={{
                    color: isLight ? 'rgba(100, 80, 60, 0.75)' : 'rgba(253, 251, 245, 0.7)',
                }}
            >
                {title}
            </span>
        </button>
    );
}
