import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useSkeletonStyles } from "./skeletonStyles.js";

export function NavigationSectionLoadingSkeleton() {
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
        <div
          className="h-[220px] w-[220px] rounded-full animate-pulse"
          style={shimmerStyle}
        />
      </div>

      <div className="flex flex-col items-center px-4 py-3 rounded-2xl" style={{ ...panelStyle, gap: '6px' }}>
        <div className="h-3 w-[190px] animate-pulse rounded-full" style={shimmerStyle} />
        <div className="h-4 w-[240px] animate-pulse rounded-full" style={shimmerStyle} />
      </div>

      <div className="space-y-6">
        <div className="rounded-[28px] px-5 py-6" style={panelStyle}>
          <div
            className="text-[11px] uppercase tracking-[0.28em]"
            style={{ color: labelColor }}
          >
            Navigation
          </div>
          <div
            className="mt-2 text-[1rem] font-medium"
            style={{ color: titleColor }}
          >
            Building your path map...
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-2xl" style={shimmerStyle} />
            <div className="h-24 animate-pulse rounded-2xl" style={shimmerStyle} />
            <div className="h-24 animate-pulse rounded-2xl" style={shimmerStyle} />
            <div className="h-24 animate-pulse rounded-2xl" style={shimmerStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}
