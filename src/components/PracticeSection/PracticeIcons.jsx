import React from "react";

// Inline SVG Icons for Practice Cards
export const PracticeIcons = {
  breath: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M8 24C8 24 12 16 24 16C36 16 40 24 40 24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 28C12 28 16 22 24 22C32 22 36 28 36 28" stroke={color} strokeWidth="1" opacity="0.6" strokeLinecap="round"/>
      <path d="M16 32C16 32 19 28 24 28C29 28 32 32 32 32" stroke={color} strokeWidth="1" opacity="0.3" strokeLinecap="round"/>
      <circle cx="24" cy="12" r="2" fill={color}/>
    </svg>
  ),
  ritual: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 8L38 32H10L24 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M24 8V32" stroke={color} strokeWidth="1" opacity="0.5"/>
      <path d="M17 20L31 20" stroke={color} strokeWidth="1" opacity="0.5"/>
      <rect x="14" y="36" width="20" height="4" rx="1" stroke={color} strokeWidth="1"/>
    </svg>
  ),
  insight: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="14" r="4" stroke={color} strokeWidth="1.5"/>
      <path d="M14 36C14 30 18 26 24 26C30 26 34 30 34 36" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 20C12 24 12 30 12 30" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <path d="M30 20C36 24 36 30 36 30" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
    </svg>
  ),
  bodyScan: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 6C26.21 6 28 7.79 28 10C28 12.21 26.21 14 24 14C21.79 14 20 12.21 20 10C20 7.79 21.79 6 24 6Z" stroke={color} strokeWidth="1.5"/>
      <path d="M24 14V30M24 30L18 42M24 30L30 42M24 18L14 26M24 18L34 26" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="14" stroke={color} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4"/>
    </svg>
  ),
  sound: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M16 18H10V30H16L24 38V10L16 18Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M30 16C33 19 33 29 30 32" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M36 12C41 17 41 31 36 36" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  visualization: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M8 24C8 24 14 12 24 12C34 12 40 24 40 24C40 24 34 36 24 36C14 36 8 24 8 24Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="5" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="2" fill={color}/>
    </svg>
  ),
  cymatics: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      <circle cx="24" cy="24" r="12" stroke={color} strokeWidth="1.5" opacity="0.7"/>
      <circle cx="24" cy="24" r="6" stroke={color} strokeWidth="1.5"/>
      <path d="M24 6V42M6 24H42" stroke={color} strokeWidth="0.5" opacity="0.3"/>
    </svg>
  ),
  photic: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="1.5" strokeDasharray="2 4" opacity="0.3"/>
      <circle cx="24" cy="24" r="14" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6"/>
      <circle cx="24" cy="24" r="10" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="4" fill={color}/>
    </svg>
  ),
  integration: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 8L38 32H10L24 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M24 8V32" stroke={color} strokeWidth="1" opacity="0.5"/>
      <path d="M17 20L31 20" stroke={color} strokeWidth="1" opacity="0.5"/>
      <rect x="14" y="36" width="20" height="4" rx="1" stroke={color} strokeWidth="1"/>
    </svg>
  ),
  awareness: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="14" r="4" stroke={color} strokeWidth="1.5"/>
      <path d="M14 36C14 30 18 26 24 26C30 26 34 30 34 36" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 20C12 24 12 30 12 30" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <path d="M30 20C36 24 36 30 36 30" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
    </svg>
  ),
  resonance: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M16 18H10V30H16L24 38V10L16 18Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M30 16C33 19 33 29 30 32" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M36 12C41 17 41 31 36 36" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  perception: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M8 24C8 24 14 12 24 12C34 12 40 24 40 24C40 24 34 36 24 36C14 36 8 24 8 24Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="5" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="2" fill={color}/>
    </svg>
  ),
};
