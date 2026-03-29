import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useSkeletonStyles } from "./skeletonStyles.js";

export function PracticeSectionLoadingSkeleton() {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const { panelStyle, shimmerStyle, labelColor, titleColor } = useSkeletonStyles(isLight);

  return (
    <div
      className="w-full max-w-6xl mx-auto"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingBottom: '32px',
      }}
    >
      <div className="flex items-center justify-center" style={{ paddingTop: '4px' }}>
        <div className="h-[220px] w-[220px] rounded-full animate-pulse" style={shimmerStyle} />
      </div>

      <div className="rounded-[28px] px-5 py-6" style={panelStyle}>
        <div
          className="text-[11px] uppercase tracking-[0.28em]"
          style={{ color: labelColor }}
        >
          Practice
        </div>
        <div
          className="mt-2 text-[1rem] font-medium"
          style={{ color: titleColor }}
        >
          Loading your practice menu...
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl" style={shimmerStyle} />
          <div className="h-24 animate-pulse rounded-2xl" style={shimmerStyle} />
          <div className="h-24 animate-pulse rounded-2xl" style={shimmerStyle} />
          <div className="h-24 animate-pulse rounded-2xl" style={shimmerStyle} />
        </div>

        <div className="mt-5 rounded-2xl p-3" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-16 w-full animate-pulse rounded-xl" style={shimmerStyle} />
        </div>
      </div>
    </div>
  );
}
