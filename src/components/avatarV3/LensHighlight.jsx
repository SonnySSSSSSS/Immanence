import React, { useMemo } from 'react';

export function LensHighlight() {
  const lensStyle = useMemo(() => {
    const duration = 45 + Math.random() * 45;
    const delay = -Math.random() * duration;
    return {
      '--avatar-v3-lens-duration': `${duration}s`,
      animationDelay: `${delay}s`,
      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(255,255,255,0) 60%)',
    };
  }, []);

  return (
    <div className="avatar-v3__layer avatar-v3__lens" style={lensStyle} />
  );
}
