export function useSkeletonStyles(isLight) {
  const panelStyle = {
    border: isLight ? '1px solid rgba(138, 111, 74, 0.18)' : '1px solid rgba(255,255,255,0.12)',
    background: isLight
      ? 'linear-gradient(180deg, rgba(247, 241, 230, 0.94), rgba(235, 225, 205, 0.88))'
      : 'linear-gradient(180deg, rgba(19, 28, 42, 0.88), rgba(11, 18, 30, 0.96))',
    boxShadow: isLight
      ? '0 18px 42px rgba(107, 79, 42, 0.12)'
      : '0 22px 48px rgba(0, 0, 0, 0.34)',
    backdropFilter: 'blur(14px)',
  };
  const shimmerStyle = {
    background: isLight
      ? 'linear-gradient(90deg, rgba(153, 122, 84, 0.08) 25%, rgba(153, 122, 84, 0.22) 50%, rgba(153, 122, 84, 0.08) 75%)'
      : 'linear-gradient(90deg, rgba(155, 180, 218, 0.06) 25%, rgba(155, 180, 218, 0.20) 50%, rgba(155, 180, 218, 0.06) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmerSweep 1.6s ease-in-out infinite',
  };
  const labelColor = isLight ? 'rgba(109, 82, 48, 0.64)' : 'rgba(205, 218, 238, 0.64)';
  const titleColor = isLight ? 'rgba(58, 42, 25, 0.92)' : 'rgba(244, 247, 252, 0.94)';
  return { panelStyle, shimmerStyle, labelColor, titleColor };
}
