// src/components/GlassIconButton.jsx
// Reusable glass icon button for practice mode toggles
// Based on SimpleModeButton with enhanced selection states

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useTheme } from '../context/ThemeContext.jsx';

// Icon name mapping for subModes
export const SUB_MODE_ICON_MAP = {
  // Awareness subModes
  insight: 'cognitive',
  cognitive_vipassana: 'cognitive',
  bodyscan: 'somatic',
  somatic_vipassana: 'somatic',
  feeling: 'emotion',

  // Resonance subModes
  aural: 'sound',
  sound: 'sound',
  cymatics: 'cymatics',

  // Perception subModes
  visualization: 'kasina',
  kasina: 'kasina',
  photic: 'photonic',

  // Foundation subModes (for future use)
  breath: 'breath',
  stillness: 'stillness'
};

export function GlassIconButton({
  label,
  iconName,
  onClick,
  selected = false,
  disabled = false
}) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const [isPressing, setIsPressing] = React.useState(false);
  const pressTimerRef = React.useRef(null);

  const theme = useTheme();
  const primaryHex = theme?.accent?.primary || '#4ade80';

  React.useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  // No background images - transparent/glass only

  // Icon rendering based on iconName
  const getIcon = () => {
    const icons = {
      cognitive: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="4" stroke="white" strokeWidth="2" opacity="0.9"/>
          <path
            d="M12 13 C8 13 6 15 6 18 L18 18 C18 15 16 13 12 13 Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      ),
      somatic: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" stroke="white" strokeWidth="2" opacity="0.9"/>
          <path
            d="M12 7 L12 14 M8 10 L16 10 M12 14 L9 20 M12 14 L15 20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      ),
      emotion: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21 C12 21 4 15 4 9 C4 6 6 4 8 4 C10 4 11 5 12 7 C13 5 14 4 16 4 C18 4 20 6 20 9 C20 15 12 21 12 21 Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      ),
      kasina: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" opacity="0.9"/>
          <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" opacity="0.6"/>
        </svg>
      ),
      photonic: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" opacity="0.9"/>
          <path
            d="M12 2 L12 6 M12 18 L12 22 M22 12 L18 12 M6 12 L2 12"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M18.4 5.6 L15.5 8.5 M8.5 15.5 L5.6 18.4 M18.4 18.4 L15.5 15.5 M8.5 8.5 L5.6 5.6"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      ),
      sound: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12 Q6 8 9 12 T15 12 T21 12"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M3 9 Q6 6 9 9 T15 9 T21 9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M3 15 Q6 18 9 15 T15 15 T21 15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
      ),
      cymatics: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" opacity="0.9"/>
          <path
            d="M12 4 L12 20 M4 12 L20 12 M7 7 L17 17 M17 7 L7 17"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" opacity="0.8"/>
        </svg>
      ),
      breath: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 8 Q6 5 9 8 T15 8 T21 8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M3 12 Q6 9 9 12 T15 12 T21 12"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M3 16 Q6 13 9 16 T15 16 T21 16"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.5"
          />
        </svg>
      ),
      stillness: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="4" ry="3" stroke="white" strokeWidth="2" opacity="0.9"/>
          <ellipse cx="12" cy="12" rx="7" ry="5" stroke="white" strokeWidth="1.5" opacity="0.6"/>
          <ellipse cx="12" cy="12" rx="10" ry="7" stroke="white" strokeWidth="1" opacity="0.3"/>
        </svg>
      ),
    };
    return icons[iconName] || icons.cognitive;
  };

  // Border color based on selection state
  const getBorderColor = () => {
    if (selected) {
      return isLight ? `${primaryHex}80` : `${primaryHex}90`;
    }
    return isLight ? `${primaryHex}40` : `${primaryHex}50`;
  };

  // Box shadow based on selection state
  const getBoxShadow = () => {
    if (selected) {
      return isLight
        ? `0 10px 28px rgba(100, 80, 60, 0.35), 0 6px 12px rgba(100, 80, 60, 0.25), 0 0 30px ${primaryHex}50, inset 0 0 20px ${primaryHex}30, inset 0 2px 6px rgba(255, 255, 255, 0.9)`
        : `0 10px 32px rgba(0, 0, 0, 0.7), 0 6px 16px rgba(0, 0, 0, 0.6), 0 0 40px ${primaryHex}70, inset 0 0 20px ${primaryHex}20, inset 0 1px 2px rgba(255, 255, 255, 0.15)`;
    }
    return isLight
      ? `0 6px 18px rgba(100, 80, 60, 0.2), 0 3px 8px rgba(100, 80, 60, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.9), 0 0 15px ${primaryHex}25`
      : `0 6px 20px rgba(0, 0, 0, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 0 20px ${primaryHex}40`;
  };

  const handleClick = () => {
    if (disabled) return;
    if (onClick) onClick();
  };

  const handlePressFeedback = () => {
    if (disabled) return;
    setIsPressing(true);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => {
      setIsPressing(false);
      pressTimerRef.current = null;
    }, 130);
  };

  const baseLabelOpacity = selected ? 0.41 : 0.31;
  const labelOpacity = Math.min(0.5, baseLabelOpacity + (isPressing ? 0.09 : 0));

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePressFeedback}
      className="group relative flex flex-col items-center"
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        filter: disabled ? 'grayscale(0.4)' : 'none',
      }}
      aria-label={label}
      aria-disabled={disabled}
      aria-pressed={selected}
    >
      <div
        className="relative flex items-center justify-center transition-all duration-300 overflow-hidden"
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'transparent',
          border: isLight ? `1px solid ${primaryHex}40` : `1px solid ${primaryHex}50`,
          boxShadow: selected
            ? (isLight
                ? `0 10px 28px rgba(100, 80, 60, 0.35), 0 6px 12px rgba(100, 80, 60, 0.25), inset 0 2px 6px rgba(255, 255, 255, 0.9), 0 0 25px ${primaryHex}40`
                : `0 10px 32px rgba(0, 0, 0, 0.6), 0 6px 16px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 0 35px ${primaryHex}60`)
            : (isLight
                ? `0 6px 18px rgba(100, 80, 60, 0.2), 0 3px 8px rgba(100, 80, 60, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.9), 0 0 15px ${primaryHex}25`
                : `0 6px 20px rgba(0, 0, 0, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 0 20px ${primaryHex}40`),
          transform: selected ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = selected ? 'scale(1.12) translateY(-2px)' : 'scale(1.08) translateY(-2px)';
          e.currentTarget.style.borderColor = isLight ? `${primaryHex}70` : `${primaryHex}80`;
          e.currentTarget.style.boxShadow = isLight
            ? `0 10px 28px rgba(100, 80, 60, 0.3), 0 6px 12px rgba(100, 80, 60, 0.2), 0 0 25px ${primaryHex}40`
            : `0 10px 32px rgba(0, 0, 0, 0.6), 0 6px 16px rgba(0, 0, 0, 0.5), 0 0 35px ${primaryHex}60`;
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = selected ? 'scale(1.05) translateY(0)' : 'scale(1) translateY(0)';
          e.currentTarget.style.borderColor = isLight ? `${primaryHex}40` : `${primaryHex}50`;
          e.currentTarget.style.boxShadow = selected
            ? (isLight
                ? `0 10px 28px rgba(100, 80, 60, 0.35), 0 6px 12px rgba(100, 80, 60, 0.25), inset 0 2px 6px rgba(255, 255, 255, 0.9), 0 0 25px ${primaryHex}40`
                : `0 10px 32px rgba(0, 0, 0, 0.6), 0 6px 16px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 0 35px ${primaryHex}60`)
            : (isLight
                ? `0 6px 18px rgba(100, 80, 60, 0.2), 0 3px 8px rgba(100, 80, 60, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.9), 0 0 15px ${primaryHex}25`
                : `0 6px 20px rgba(0, 0, 0, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 0 20px ${primaryHex}40`);
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
      <div
        style={{
          marginTop: '5px',
          marginLeft: '4px',
          marginRight: '4px',
          padding: '0 7px',
          borderRadius: '6px',
          background: `rgba(0, 0, 0, ${labelOpacity})`,
          transition: 'background-color 130ms ease',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          className="font-medium"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--type-label-size)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: selected
              ? (isLight ? 'rgba(100, 80, 60, 0.95)' : 'rgb(248, 247, 244)')
              : (isLight ? 'rgba(100, 80, 60, 0.85)' : 'rgba(248, 247, 244, 0.9)'),
            textShadow: 'none',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            transition: 'color 0.3s ease',
          }}
        >
          {label}
        </span>
      </div>
    </button>
  );
}
