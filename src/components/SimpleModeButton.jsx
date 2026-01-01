// src/components/SimpleModeButton.jsx
// Mode button with cosmic dark mode and watercolor light mode imagery

import { useSettingsStore } from '../state/settingsStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function SimpleModeButton({ title, onClick, icon }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const buttonThemeDark = useSettingsStore(s => s.buttonThemeDark);
    const buttonThemeLight = useSettingsStore(s => s.buttonThemeLight);
    const isLight = colorScheme === 'light';

    // Get appropriate background image based on mode, theme and icon
    const getBackgroundImage = () => {
        const theme = isLight ? buttonThemeLight : buttonThemeDark;
        const mode = isLight ? 'light' : 'dark';
        const imagePath = `${import.meta.env.BASE_URL}mode_buttons/${icon}_${theme}_${mode}.png`;
        return imagePath;
    };

    const getIcon = () => {
        switch (icon) {
            case 'practice':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
                    </svg>
                );
            case 'wisdom':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
                    </svg>
                );
            case 'application':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" fill="none" opacity="0.9" />
                        <path d="M12 3v18M19.07 7.5l-14.14 9M19.07 16.5l-14.14-9" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    </svg>
                );
            case 'navigation':
                return (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" fill="none" opacity="0.9" />
                        <path d="M12 3L14 9H20L15 13L17 19L12 15L7 19L9 13L4 9H10L12 3Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative flex flex-col items-center gap-1.5"
            style={{ cursor: 'pointer' }}
            aria-label={title}
        >
            <div
                className="relative flex items-center justify-center transition-all duration-300 overflow-hidden"
                style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundImage: `url(${getBackgroundImage()})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: isLight
                        ? '0 4px 12px rgba(100, 80, 60, 0.15), 0 2px 4px rgba(100, 80, 60, 0.1)'
                        : '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = isLight
                        ? '0 8px 20px rgba(100, 80, 60, 0.25), 0 4px 8px rgba(100, 80, 60, 0.15)'
                        : '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.35)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = isLight
                        ? '0 4px 12px rgba(100, 80, 60, 0.15), 0 2px 4px rgba(100, 80, 60, 0.1)'
                        : '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)';
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
                {getIcon()}
            </div>
            <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{
                    color: isLight ? 'rgba(100, 80, 60, 0.75)' : 'rgba(253, 251, 245, 0.7)',
                    letterSpacing: '0.08em',
                }}
            >
                {title}
            </span>
        </button>
    );
}
