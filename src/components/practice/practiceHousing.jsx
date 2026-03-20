import React from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export function getPracticeHousingStyles({ isLight = false, radius = 20, quiet = true } = {}) {
  const radiusPx = typeof radius === 'number' ? `${radius}px` : radius;
  const chamfer = quiet ? '14px' : '18px';
  const clipPath = `polygon(${chamfer} 0, calc(100% - ${chamfer}) 0, 100% ${chamfer}, 100% calc(100% - ${chamfer}), calc(100% - ${chamfer}) 100%, ${chamfer} 100%, 0 calc(100% - ${chamfer}), 0 ${chamfer})`;

  return {
    radius: radiusPx,
    clipPath,
    shell: {
      borderRadius: radiusPx,
      clipPath,
      overflow: 'visible',
      boxShadow: isLight
        ? '0 14px 28px rgba(18, 40, 52, 0.10)'
        : '0 18px 34px rgba(0, 0, 0, 0.30), 0 0 12px rgba(78, 214, 226, 0.10)',
    },
    panel: {
      borderRadius: radiusPx,
      clipPath,
      background: isLight ? 'rgba(239, 247, 248, 0.88)' : 'rgba(7, 14, 20, 0.82)',
      border: 'none',
      backdropFilter: isLight ? 'blur(6px)' : 'blur(14px)',
      WebkitBackdropFilter: isLight ? 'blur(6px)' : 'blur(14px)',
      isolation: 'isolate',
    },
    content: {
      position: 'relative',
      zIndex: 10,
      isolation: 'isolate',
    },
    background: {
      background: isLight
        ? 'radial-gradient(circle at 18% 18%, rgba(108, 207, 218, 0.06), transparent 26%), linear-gradient(180deg, rgba(248, 252, 252, 0.84) 0%, rgba(229, 241, 244, 0.62) 100%)'
        : 'radial-gradient(circle at 20% 20%, rgba(78, 214, 226, 0.05), transparent 24%), linear-gradient(180deg, rgba(8, 15, 22, 0.72) 0%, rgba(5, 10, 16, 0.80) 100%)',
    },
  };
}

export function PracticeHousingChrome({ isLight = false, quiet = true, radius = 20 }) {
  const styles = getPracticeHousingStyles({ isLight, quiet, radius });
  const railColor = isLight
    ? 'linear-gradient(90deg, transparent, rgba(52, 139, 152, 0.32) 14%, rgba(52, 139, 152, 0.10) 86%, transparent)'
    : 'linear-gradient(90deg, transparent, rgba(117, 231, 240, 0.36) 16%, rgba(117, 231, 240, 0.10) 86%, transparent)';
  const bracketColor = isLight ? 'rgba(59, 144, 156, 0.46)' : 'rgba(117, 231, 240, 0.52)';

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: styles.clipPath,
          background: isLight
            ? 'linear-gradient(180deg, rgba(228, 244, 248, 0.82) 0%, rgba(206, 232, 238, 0.56) 100%)'
            : 'linear-gradient(180deg, rgba(7, 16, 24, 0.94) 0%, rgba(4, 10, 18, 0.90) 100%)',
          border: `1px solid ${isLight ? 'rgba(97, 177, 190, 0.26)' : 'rgba(112, 233, 242, 0.18)'}`,
          boxShadow: isLight
            ? 'inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -8px 20px rgba(18,40,52,0.06)'
            : 'inset 0 1px 0 rgba(168, 241, 248, 0.06), inset 0 -10px 18px rgba(0,0,0,0.34)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '8px',
          clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
          background: isLight
            ? 'linear-gradient(180deg, rgba(242, 250, 252, 0.48) 0%, rgba(219, 238, 242, 0.24) 100%)'
            : 'linear-gradient(180deg, rgba(8, 16, 24, 0.46) 0%, rgba(10, 20, 29, 0.36) 46%, rgba(4, 10, 17, 0.48) 100%)',
          border: `1px solid ${isLight ? 'rgba(91, 165, 177, 0.16)' : 'rgba(101, 211, 224, 0.10)'}`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div aria-hidden="true" style={{ position: 'absolute', left: '16px', right: '16px', top: '12px', height: '1px', background: railColor, pointerEvents: 'none', zIndex: 1 }} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '16px', right: '16px', bottom: '12px', height: '1px', background: railColor, pointerEvents: 'none', zIndex: 1 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: '10px', left: '10px', width: '14px', height: '14px', borderTop: `1px solid ${bracketColor}`, borderLeft: `1px solid ${bracketColor}`, pointerEvents: 'none', zIndex: 1 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: '10px', right: '10px', width: '14px', height: '14px', borderTop: `1px solid ${bracketColor}`, borderRight: `1px solid ${bracketColor}`, pointerEvents: 'none', zIndex: 1 }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: '10px', left: '10px', width: '14px', height: '14px', borderBottom: `1px solid ${bracketColor}`, borderLeft: `1px solid ${bracketColor}`, pointerEvents: 'none', zIndex: 1 }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: '10px', right: '10px', width: '14px', height: '14px', borderBottom: `1px solid ${bracketColor}`, borderRight: `1px solid ${bracketColor}`, pointerEvents: 'none', zIndex: 1 }} />
    </>
  );
}
