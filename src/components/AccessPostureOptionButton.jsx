import React from "react";

export function AccessPostureOptionButton({ label, value, accessPosture, isLight }) {
  return (
    <span
      className="relative z-10 font-black uppercase tracking-[0.14em]"
      style={{
        fontSize: '9px',
        padding: '0 8px',
        color: accessPosture === value
          ? (isLight ? 'var(--accent-color)' : 'var(--accent-90)')
          : (isLight ? 'rgba(80,80,80,0.45)' : 'rgba(200,200,200,0.38)'),
        transition: 'color 200ms',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {label}
    </span>
  );
}
