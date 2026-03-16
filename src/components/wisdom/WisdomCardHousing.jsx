import React from 'react';
import { getPracticeHousingStyles } from '../practice/practiceHousing.jsx';

export function WisdomCardHousing({
  children,
  className = '',
  cardId,
  style,
  contentClassName = '',
  contentStyle,
}) {
  const housing = getPracticeHousingStyles({ isLight: false, radius: 24, quiet: true });
  const cornerColor = 'rgba(117, 231, 240, 0.48)';
  const railColor = 'linear-gradient(90deg, rgba(117, 231, 240, 0.64) 0%, rgba(117, 231, 240, 0.22) 18%, rgba(117, 231, 240, 0.1) 82%, rgba(117, 231, 240, 0.44) 100%)';

  return (
    <>
      {/* PROBE:wisdom-card-housing:START */}
      <div
        data-card="true"
        data-card-id={cardId}
        className={`im-card relative overflow-hidden ${className}`.trim()}
        style={{
          ...housing.panel,
          ...housing.shell,
          ...style,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: housing.clipPath,
            background: 'linear-gradient(180deg, rgba(7, 16, 24, 0.96) 0%, rgba(4, 10, 18, 0.92) 100%)',
            border: '1px solid rgba(112, 233, 242, 0.18)',
            boxShadow: 'inset 0 1px 0 rgba(168, 241, 248, 0.08), inset 0 -10px 18px rgba(0,0,0,0.34)',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-[8px] pointer-events-none"
          style={{
            clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
            background: 'linear-gradient(180deg, rgba(8, 16, 24, 0.42) 0%, rgba(9, 18, 27, 0.3) 44%, rgba(4, 10, 17, 0.46) 100%)',
            border: '1px solid rgba(101, 211, 224, 0.10)',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-0 h-px pointer-events-none"
          style={{
            background: railColor,
            boxShadow: '0 0 10px rgba(87, 222, 236, 0.2)',
            zIndex: 2,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-4 right-4 bottom-3 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(117, 231, 240, 0.2) 12%, rgba(117, 231, 240, 0.08) 88%, transparent)',
            zIndex: 1,
          }}
        />
        <div aria-hidden="true" className="absolute top-[10px] left-[10px] w-[14px] h-[14px] pointer-events-none" style={{ borderTop: `1px solid ${cornerColor}`, borderLeft: `1px solid ${cornerColor}`, zIndex: 2 }} />
        <div aria-hidden="true" className="absolute top-[10px] right-[10px] w-[14px] h-[14px] pointer-events-none" style={{ borderTop: `1px solid ${cornerColor}`, borderRight: `1px solid ${cornerColor}`, zIndex: 2 }} />
        <div aria-hidden="true" className="absolute bottom-[10px] left-[10px] w-[14px] h-[14px] pointer-events-none" style={{ borderBottom: `1px solid ${cornerColor}`, borderLeft: `1px solid ${cornerColor}`, zIndex: 2 }} />
        <div aria-hidden="true" className="absolute bottom-[10px] right-[10px] w-[14px] h-[14px] pointer-events-none" style={{ borderBottom: `1px solid ${cornerColor}`, borderRight: `1px solid ${cornerColor}`, zIndex: 2 }} />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            ...housing.background,
            opacity: 0.96,
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 18% 16%, rgba(78, 214, 226, 0.05), transparent 22%), linear-gradient(180deg, rgba(8, 16, 24, 0.14) 0%, rgba(4, 9, 16, 0.24) 100%)',
            zIndex: 0,
          }}
        />
        <div
          className={`relative z-10 ${contentClassName}`.trim()}
          style={contentStyle}
        >
          {children}
        </div>
      </div>
      {/* PROBE:wisdom-card-housing:END */}
    </>
  );
}
