import React from "react";
import { useDisplayModeStore } from "../../state/displayModeStore.js";

/**
 * Unified practice menu header component.
 * Provides a centered title row for practice menus.
 *
 * @param {string} title - The menu title (e.g., "BREATH & STILLNESS")
 * @param {React.ReactNode} children - Optional content below the header row (e.g., submode toggles)
 * @param {string} marginBottom - Optional margin-bottom for the header container
 */
export function PracticeMenuHeader({
  title,
  children,
  marginBottom = '24px',
}) {
  const hasTitle = Boolean(title);
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const isLight = colorScheme === 'light';

  return (
    <div className="practiceMenuHeader" style={{ marginTop: hasTitle ? '16px' : '0px', marginBottom }}>
      {/* Title row: centered title on its own line (only render if title provided) */}
      {hasTitle && (
        <div className="practiceMenuHeaderTitleRow">
          <div
            className="practiceMenuHeaderTitle type-h2"
            title={title}
            style={{
              color: isLight ? 'rgba(35,20,10,0.95)' : '#F5E6D3',
            }}
          >
            {title}
          </div>
        </div>
      )}

      {/* Optional children (e.g., submode toggles) */}
      {children}
    </div>
  );
}

export default PracticeMenuHeader;
