import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useSkeletonStyles } from "./skeletonStyles.js";

export function ApplicationSectionLoadingSkeleton() {
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
      <div className="rounded-[28px] px-5 py-6" style={panelStyle}>
        <div
          className="text-[11px] uppercase tracking-[0.28em]"
          style={{ color: labelColor }}
        >
          Application
        </div>
        <div
          className="mt-2 text-[1rem] font-medium"
          style={{ color: titleColor }}
        >
          Loading your workspace...
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="h-28 animate-pulse rounded-2xl" style={shimmerStyle} />
          <div className="h-28 animate-pulse rounded-2xl" style={shimmerStyle} />
          <div className="col-span-2 h-20 animate-pulse rounded-2xl" style={shimmerStyle} />
        </div>
      </div>
    </div>
  );
}
