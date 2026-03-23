// src/components/practice/CircuitTrainingSelector.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PRACTICE_REGISTRY } from "../PracticeSection/constants.js";
import { useDisplayModeStore } from "../../state/displayModeStore.js";
import { Z } from "../../tokens/zIndex.js";

// Build DEFAULT_ITEMS from registry to ensure labels stay synchronized
const getRailColor = (id) => {
  const colorMap = {
    breath: "rgba(52,211,153,0.95)",
    integration: "rgba(245,158,11,0.95)",
    circuit: "rgba(168,85,247,0.95)",
    awareness: "rgba(56,189,248,0.95)",
    resonance: "rgba(20,210,200,0.95)",
    perception: "rgba(96,165,250,0.95)",
  };
  return colorMap[id] || "rgba(255,255,255,0.5)";
};

const DEFAULT_ITEMS = ["breath", "integration", "circuit", "awareness", "resonance", "perception"].map((id) => ({
  id,
  label: PRACTICE_REGISTRY[id]?.label || id,
  rail: getRailColor(id),
}));

export function CircuitTrainingSelector({
  items = DEFAULT_ITEMS,
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const rootRef = useRef(null);

  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const isLight = colorScheme === "light";

  const activeId = value ?? items[0]?.id;
  const active = useMemo(
    () => items.find((x) => x.id === activeId) ?? items[0],
    [items, activeId]
  );

  const bgImageUrl = `${import.meta.env.BASE_URL}bg/practice-breath-mandala.webp`;
  const selectorBgImage = isLight
    ? `linear-gradient(180deg, rgba(248, 252, 252, 0.92) 0%, rgba(231, 242, 244, 0.86) 100%), url("${bgImageUrl}")`
    : `linear-gradient(rgba(20, 15, 25, 0.35), rgba(20, 15, 25, 0.55)), url("${bgImageUrl}")`;
  const selectorBorder = isLight ? "rgba(97, 177, 190, 0.26)" : "rgba(255,255,255,0.10)";
  const selectorHoverBorder = isLight ? "rgba(97, 177, 190, 0.40)" : "rgba(255,255,255,0.20)";
  const selectorShadow = isLight
    ? (open ? "0 14px 28px rgba(18, 40, 52, 0.10)" : "0 10px 22px rgba(18, 40, 52, 0.08)")
    : "none";

  // Animation state management
  useEffect(() => {
    if (!open) {
      const id = requestAnimationFrame(() => setAnimIn(false));
      return () => cancelAnimationFrame(id);
    }
    const id = requestAnimationFrame(() => setAnimIn(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Update portal position when open
  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (r) {
        setPortalPos({
          top: r.bottom + 8,
          left: r.left,
          width: r.width,
        });
      }
    };

    updatePosition();

    // Listen for scroll and resize to keep dropdown positioned correctly
    const handleScroll = updatePosition;
    const handleResize = updatePosition;

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  const select = (id) => {
    onChange?.(id);
    setOpen(false);
  };

  const practiceTypeForFx = (() => {
    if (!activeId) return "awareness";
    if (activeId === "perception") return "visual";
    if (activeId === "resonance") return "sound";
    return activeId;
  })();

  return (
    <div ref={rootRef} className="relative">
      {/* Collapsed selector button - primary control */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-practice-type={practiceTypeForFx}
        data-practice-id={activeId}
        data-ui-target="true"
        data-ui-scope="role"
        data-ui-role-group="practice"
        data-ui-id="practice:dropdown:method"
        data-ui-fx-surface="true"
        className={
          "relative w-full text-left rounded-lg border transition-all duration-200 " +
          "flex items-center gap-3 px-4 py-3 overflow-hidden"
        }
        style={{
          fontFamily: 'var(--font-display)',
          backgroundImage: selectorBgImage,
          backgroundSize: 'auto, cover',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: isLight ? "normal, luminosity" : "normal, normal",
          borderColor: open ? `${active.rail}55` : selectorBorder,
          boxShadow: open
            ? `0 0 0 1px ${active.rail}33, ${selectorShadow}`
            : selectorShadow,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = selectorHoverBorder;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = open ? `${active.rail}55` : selectorBorder;
        }}
      >
        {/* Color rail indicator */}
        <div
          className="w-2 h-7 rounded-full flex-shrink-0"
          style={{
            background: active.rail,
            opacity: 0.85,
          }}
        />

        {/* Active label - shows category name */}
        <div className="flex-1 min-w-0">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 7px',
              borderRadius: '6px',
              background: isLight ? "rgba(255, 255, 255, 0.52)" : "rgba(0, 0, 0, 0.33)",
              border: isLight ? "1px solid rgba(60, 50, 35, 0.10)" : "1px solid rgba(255,255,255,0.06)",
              backdropFilter: isLight ? "blur(10px)" : undefined,
              WebkitBackdropFilter: isLight ? "blur(10px)" : undefined,
              maxWidth: '100%',
            }}
          >
            <div
              className="text-sm truncate font-medium"
              style={{
                fontFamily: 'var(--font-display)',
                color: isLight ? "rgba(24, 47, 55, 0.92)" : "rgba(255, 255, 255, 0.92)",
                lineHeight: 1,
              }}
            >
              {active.label}
            </div>
          </div>
        </div>

        {/* Chevron indicator */}
        <div
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: isLight ? "rgba(60, 50, 35, 0.55)" : "rgba(255,255,255,0.40)",
          }}
        >
          <svg aria-hidden="true" width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      {/* Portal: Full-screen backdrop + dropdown menu */}
      {open && createPortal(
        <>
          {/* Transparent backdrop to capture outside clicks */}
          <div
            className="fixed inset-0"
            style={{
              background: 'transparent',
              pointerEvents: 'auto',
              zIndex: Z.dropdownBackdrop,
            }}
            onClick={() => setOpen(false)}
          />

          {/* Dropdown menu positioned absolutely */}
          <div
            className={
              "fixed " +
              "rounded-lg border " +
              (isLight ? "" : "border-white/10 ") +
              (isLight ? "shadow-[0_12px_40px_rgba(18,40,52,0.18)] " : "shadow-[0_12px_40px_rgba(0,0,0,0.6)] ") +
              "transition-all duration-150 ease-out"
            }
            style={{
              top: `${portalPos.top}px`,
              left: `${portalPos.left}px`,
              width: `${portalPos.width}px`,
              zIndex: Z.portal,
              transformOrigin: 'top center',
              transform: animIn ? 'scaleY(1)' : 'scaleY(0.92)',
              opacity: animIn ? 1 : 0,
              backgroundImage: selectorBgImage,
              backgroundSize: 'auto, cover',
              backgroundPosition: 'center, center',
              backgroundRepeat: 'no-repeat',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundBlendMode: isLight ? "normal, luminosity" : "normal, normal",
              borderColor: isLight ? selectorBorder : undefined,
            }}
          >
            <div className="py-1.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  className="w-full text-left px-3 py-2 transition-colors"
                  style={{
                    background:
                      item.id === activeId
                        ? (isLight ? "rgba(60, 50, 35, 0.08)" : "rgba(255,255,255,0.08)")
                        : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (item.id === activeId) return;
                    e.currentTarget.style.background = isLight ? "rgba(60, 50, 35, 0.05)" : "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (item.id === activeId) return;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Color pill */}
                    <div
                      className="w-2 h-5 rounded-full flex-shrink-0"
                      style={{
                        background: item.rail,
                        opacity: item.id === activeId ? 1 : 0.55,
                      }}
                    />

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0 6px',
                          borderRadius: '6px',
                          background: isLight
                            ? `rgba(255, 255, 255, ${item.id === activeId ? 0.52 : 0.46})`
                            : `rgba(0, 0, 0, ${item.id === activeId ? 0.40 : 0.30})`,
                          border: isLight ? "1px solid rgba(60, 50, 35, 0.10)" : "1px solid rgba(255,255,255,0.06)",
                          maxWidth: '100%',
                        }}
                      >
                        <div
                          className={
                            "text-sm truncate " +
                            (item.id === activeId ? "font-medium" : "")
                          }
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: isLight
                              ? (item.id === activeId ? "rgba(24, 47, 55, 0.92)" : "rgba(24, 47, 55, 0.78)")
                              : (item.id === activeId ? item.rail : "rgba(255, 255, 255, 0.82)"),
                            lineHeight: 1,
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
