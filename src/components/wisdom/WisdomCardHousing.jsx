import React from 'react';
import { getPracticeHousingStyles, PracticeHousingChrome } from '../practice/practiceHousing.jsx';

export function WisdomCardHousing({
  children,
  className = '',
  cardId,
  style,
  contentClassName = '',
  contentStyle,
}) {
  const housing = getPracticeHousingStyles({ isLight: false, radius: 24, quiet: true });

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
        <PracticeHousingChrome isLight={false} quiet radius={24} />
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
