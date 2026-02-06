import React from 'react';
import './AvatarV3.css';

export function AvatarV3Container({
  size = 'hearth',
  isPracticing = false,
  breathDuration,
  breathMin,
  breathMax,
  driftDuration,
  lensDuration,
  settleActive,
  stackStyle,
  ariaLabel,
  onTap,
  children,
}) {
  const sizeClass = size === 'sanctuary' ? 'avatar-v3--sanctuary' : 'avatar-v3--hearth';
  const presenceClass = settleActive ? 'avatar-v3__presence avatar-v3__presence--settle' : 'avatar-v3__presence';
  const handleTap = (event) => {
    if (onTap) onTap(event);
  };

  return (
    <div
      className={`avatar-v3 ${sizeClass}`}
      role="img"
      aria-label={ariaLabel}
      onClick={handleTap}
    >
      <div
        className="avatar-v3__drift"
        style={{
          '--avatar-v3-drift-duration': `${driftDuration}s`,
        }}
        data-practicing={isPracticing ? 'true' : 'false'}
      >
        <div
          className={presenceClass}
          style={{
            '--avatar-v3-breath-duration': `${breathDuration}s`,
            '--avatar-v3-breath-min': breathMin,
            '--avatar-v3-breath-max': breathMax,
            '--avatar-v3-lens-duration': `${lensDuration}s`,
          }}
        >
          <div className="avatar-v3__stack" style={stackStyle}>{children}</div>
        </div>
      </div>
    </div>
  );
}
