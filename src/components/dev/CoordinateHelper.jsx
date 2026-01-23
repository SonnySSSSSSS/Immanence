// src/components/dev/CoordinateHelper.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../state/settingsStore';

/**
 * Resolves tutorial pick data from a click event.
 * Scans the entire elementsFromPoint stack to find the first element with a data-tutorial ancestor.
 * This approach naturally skips all overlays (scrim, tooltip, etc.) without complex filtering.
 */
function resolveTutorialPickFromEvent(e, overlayRef, debugMode = true) {
  const x = e.clientX;
  const y = e.clientY;

  const stack = document.elementsFromPoint(x, y);
  const overlayEl = overlayRef?.current;

  // Debug instrumentation: log what we're seeing at this point
  if (debugMode) {
    console.log('[TutorialPick] elementsFromPoint at', { x, y });
    console.log('[TutorialPick] Stack:', stack.map((n, idx) => ({
      index: idx,
      tag: n.tagName,
      className: typeof n.className === 'string' ? n.className : '',
      id: n.id || null,
      hasPickIgnore: n.getAttribute?.('data-pick-ignore'),
      hasTutorial: n.getAttribute?.('data-tutorial'),
      computedPosition: window.getComputedStyle(n).position,
      rect: {
        width: Math.round(n.getBoundingClientRect().width),
        height: Math.round(n.getBoundingClientRect().height),
      }
    })));
  }

  // Helper: find nearest ancestor with data-tutorial
  const findAnchor = (node) => {
    let cur = node;
    while (cur && cur !== document.documentElement) {
      if (cur instanceof HTMLElement) {
        const v = cur.getAttribute("data-tutorial");
        if (v) return { anchorEl: cur, anchorId: v };
      }
      cur = cur.parentElement;
    }
    return null;
  };

  // Scan the stack for the FIRST element that yields a data-tutorial anchor.
  // This ignores all overlays naturally (unless the overlay itself has data-tutorial).
  let bestHit = null;
  let anchorEl = null;
  let anchorId = null;

  for (const node of stack) {
    if (!(node instanceof HTMLElement)) continue;

    // Skip our own pick overlay
    if (overlayEl) {
      if (node === overlayEl) continue;
      if (overlayEl.contains(node)) continue;
    }

    // Optional: skip elements explicitly marked as overlay UI
    if (node.closest?.('[data-tutorial-overlay="true"]')) continue;
    if (node.closest?.('[data-pick-ignore="true"]')) continue;
    if (node.classList?.contains("tutorial-scrim")) continue;

    const found = findAnchor(node);
    if (found) {
      bestHit = node;
      anchorEl = found.anchorEl;
      anchorId = found.anchorId;
      break;
    }

    // Keep the first reasonable non-overlay as fallback "hit"
    if (!bestHit) bestHit = node;
  }

  const rect = anchorEl ? anchorEl.getBoundingClientRect() : null;

  return {
    ts: Date.now(),
    coordSpace: "viewport",
    x,
    y,
    anchorId: anchorId || null,
    hit: bestHit
      ? {
          tag: bestHit.tagName,
          id: bestHit.id || null,
          className:
            typeof bestHit.className === "string" ? bestHit.className : null,
        }
      : null,
    anchorRect: rect
      ? {
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      : null,
  };
}

/**
 * Generic coordinate helper wrapper.
 * When showCoordinateHelper is active, wraps children with a click-tracking overlay.
 * Now also includes Tutorial Pick mode for capturing data-tutorial anchors.
 */
export function CoordinateHelper({ children, className = "", label = "" }) {
    const showCoordinateHelper = useSettingsStore(s => s.showCoordinateHelper);
    const [tutorialPickOn, setTutorialPickOn] = useState(false);
    const [lastTutorialPick, setLastTutorialPick] = useState(null);
    const pickOverlayRef = useRef(null);

    // Toggle tutorial-pick-mode class on html when tutorialPickOn changes
    // Also expose global flag for TutorialOverlay to disable pointer events
    useEffect(() => {
        const root = document.documentElement;
        if (tutorialPickOn) {
            root.classList.add('tutorial-pick-mode');
            window.__TUTORIAL_PICK_ON__ = true;
        } else {
            root.classList.remove('tutorial-pick-mode');
            window.__TUTORIAL_PICK_ON__ = false;
        }

        return () => {
            root.classList.remove('tutorial-pick-mode');
            window.__TUTORIAL_PICK_ON__ = false;
        };
    }, [tutorialPickOn]);

    const handleCoordClick = (e) => {
        // If Tutorial Pick is off, use existing coordinate logger
        if (!tutorialPickOn) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            const out = `${label ? `[${label}] ` : ''}Coordinate: { x: ${x.toFixed(1)}, y: ${y.toFixed(1)} }`;
            console.log(`🎯 ${out}`);
            return;
        }

        // Tutorial Pick mode: capture anchor + coordinates
        e.preventDefault();
        e.stopPropagation();

        const pick = resolveTutorialPickFromEvent(e, pickOverlayRef);
        setLastTutorialPick(pick);

        // Expose globally for quick manual inspection
        window.__IMMANENCE_TUTORIAL_PICK__ = pick;

        console.log("[TutorialPick]", pick);
    };

    if (!showCoordinateHelper) return children;

    return (
        <div className={`relative ${className}`}>
            {children}

            {/* Tutorial Pick overlay - captures clicks without affecting UI */}
            {tutorialPickOn && (
                <div
                    ref={pickOverlayRef}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 999999,
                        background: "transparent",
                        cursor: "crosshair",
                    }}
                    onPointerDownCapture={(e) => {
                        const pick = resolveTutorialPickFromEvent(e, pickOverlayRef);
                        setLastTutorialPick(pick);
                        window.__IMMANENCE_TUTORIAL_PICK__ = pick;

                        // Prevent click-through
                        e.preventDefault();
                        e.stopPropagation();

                        console.log("[TutorialPick]", pick);
                    }}
                />
            )}

            {/* Tutorial Pick HUD - shows pick info at click point */}
            {tutorialPickOn && lastTutorialPick && (
                <div
                    style={{
                        position: "fixed",
                        left: lastTutorialPick.x,
                        top: lastTutorialPick.y,
                        transform: "translate(8px, 8px)",
                        zIndex: 1000000,
                        fontSize: 11,
                        padding: "6px 8px",
                        borderRadius: 10,
                        background: "rgba(10,10,14,0.88)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.85)",
                        pointerEvents: "none",
                        maxWidth: 280,
                    }}
                >
                    <div>x: {lastTutorialPick.x}, y: {lastTutorialPick.y}</div>
                    <div>anchor: {lastTutorialPick.anchorId || "(none)"}</div>
                </div>
            )}

            {/* Original coordinate helper overlay */}
            {!tutorialPickOn && (
                <div
                    className="absolute inset-0 z-[9999] cursor-crosshair bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 transition-colors group flex items-center justify-center"
                    onClick={handleCoordClick}
                    title={`Dev: Click to log coordinates${label ? ` for ${label}` : ''}`}
                >
                    <div className="text-[8px] text-cyan-400 font-mono opacity-0 group-hover:opacity-100 bg-black/80 px-1 rounded pointer-events-none">
                        INSPECTOR {label}
                    </div>
                </div>
            )}

            {/* Tutorial Pick Controls - floating panel */}
            {showCoordinateHelper && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 80,
                        right: 20,
                        zIndex: 1000001,
                        background: "rgba(10, 10, 14, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        minWidth: 200,
                    }}
                >
                    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                        <input
                            type="checkbox"
                            checked={tutorialPickOn}
                            onChange={(e) => {
                                setTutorialPickOn(e.target.checked);
                                if (!e.target.checked) {
                                    setLastTutorialPick(null);
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        />
                        Tutorial Pick
                    </label>

                    {lastTutorialPick && (
                        <button
                            type="button"
                            onClick={() => {
                                const txt = JSON.stringify(lastTutorialPick, null, 2);
                                navigator.clipboard?.writeText(txt);
                                console.log("[TutorialPick] copied:", lastTutorialPick);
                            }}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "1px solid rgba(74, 222, 128, 0.3)",
                                background: "rgba(74, 222, 128, 0.1)",
                                color: "rgba(74, 222, 128, 0.9)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 150ms",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = "rgba(74, 222, 128, 0.2)";
                                e.target.style.borderColor = "rgba(74, 222, 128, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = "rgba(74, 222, 128, 0.1)";
                                e.target.style.borderColor = "rgba(74, 222, 128, 0.3)";
                            }}
                        >
                            Copy pick JSON
                        </button>
                    )}

                    {lastTutorialPick?.anchorId && (
                        <button
                            type="button"
                            onClick={() => {
                                // Determine placement based on click position vs anchor rect
                                let placement = "bottom";
                                if (lastTutorialPick.anchorRect) {
                                    const rect = lastTutorialPick.anchorRect;
                                    const x = lastTutorialPick.x;
                                    const y = lastTutorialPick.y;
                                    const width = rect.width;
                                    const height = rect.height;
                                    
                                    // Check horizontal thirds
                                    if (x < rect.left + width / 3) {
                                        placement = "right";
                                    } else if (x > rect.left + (2 * width / 3)) {
                                        placement = "left";
                                    }
                                    // Check vertical thirds (override horizontal if in top third)
                                    else if (y < rect.top + height / 3) {
                                        placement = "bottom";
                                    } else {
                                        placement = "top";
                                    }
                                }

                                const snippet = `{
  title: "TODO",
  body: "TODO",
  target: '[data-tutorial="${lastTutorialPick.anchorId}"]',
  placement: "${placement}",
},`;
                                navigator.clipboard?.writeText(snippet);
                                console.log("[TutorialPick] Copied step snippet:\n" + snippet);
                            }}
                            style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "1px solid rgba(234, 179, 8, 0.3)",
                                background: "rgba(234, 179, 8, 0.1)",
                                color: "rgba(234, 179, 8, 0.9)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 150ms",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = "rgba(234, 179, 8, 0.2)";
                                e.target.style.borderColor = "rgba(234, 179, 8, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = "rgba(234, 179, 8, 0.1)";
                                e.target.style.borderColor = "rgba(234, 179, 8, 0.3)";
                            }}
                        >
                            Copy step snippet
                        </button>
                    )}

                    {lastTutorialPick && (
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                            {lastTutorialPick.anchorId ? (
                                <>✓ Anchor: {lastTutorialPick.anchorId}</>
                            ) : (
                                <>⚠ No anchor found</>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
