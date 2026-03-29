import { useEffect, useRef } from "react";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { markFirstLoginAudit } from "../utils/firstLoginAudit.js";
import { useSkeletonStyles } from "./skeletonStyles.js";

export function HomeHubLoadingFallback() {
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const hasLoggedRef = useRef(false);
  const isLight = colorScheme === 'light';
  const { panelStyle, shimmerStyle, labelColor, titleColor } = useSkeletonStyles(isLight);

  useEffect(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    markFirstLoginAudit('app:homehub-fallback-rendered', {
      colorScheme,
    });
  }, [colorScheme]);

  return (
    <div
      className="w-full max-w-6xl mx-auto"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingBottom: '32px',
      }}
    >
      <div className="flex items-center justify-center gap-4" style={{ paddingTop: '4px' }}>
        <div className="h-28 w-20 rounded-2xl animate-pulse" style={shimmerStyle} />
        <div className="h-[220px] w-[220px] rounded-full animate-pulse" style={shimmerStyle} />
        <div className="h-28 w-20 rounded-2xl animate-pulse" style={shimmerStyle} />
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="h-12 w-[128px] rounded-full animate-pulse" style={shimmerStyle} />
        <div className="h-12 w-[128px] rounded-full animate-pulse" style={shimmerStyle} />
      </div>

      <div className="rounded-[28px] px-5 py-6" style={panelStyle}>
        <div
          className="text-[11px] uppercase tracking-[0.28em]"
          style={{ color: labelColor }}
        >
          HomeHub
        </div>
        <div
          className="mt-2 text-[1rem] font-medium"
          style={{ color: titleColor }}
        >
          Restoring your sanctuary...
        </div>

        <div className="mt-5 space-y-3">
          <div className="h-4 w-[42%] animate-pulse rounded-full" style={shimmerStyle} />
          <div className="h-3 w-[75%] animate-pulse rounded-full" style={shimmerStyle} />
          <div className="h-3 w-[62%] animate-pulse rounded-full" style={shimmerStyle} />
        </div>

        <div className="mt-5 rounded-2xl p-3" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-36 w-full animate-pulse rounded-xl" style={shimmerStyle} />
        </div>
      </div>
    </div>
  );
}
