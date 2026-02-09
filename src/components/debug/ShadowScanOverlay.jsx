import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  getDebugStorageValue,
  isDebugFlagEnabled,
  resetAllDebugFlags,
  setDebugFlag,
  setDebugStorageValue,
  toggleDebugFlag,
} from "./debugFlags.js";

function summarizeEl(el) {
  if (!(el instanceof HTMLElement)) return null;
  const cs = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  const boxShadow = cs.boxShadow && cs.boxShadow !== "none" ? cs.boxShadow : "";
  const filter = cs.filter && cs.filter !== "none" ? cs.filter : "";
  const backdropFilter =
    cs.backdropFilter && cs.backdropFilter !== "none" ? cs.backdropFilter : "";

  const maskImage =
    (cs.maskImage && cs.maskImage !== "none" ? cs.maskImage : "") ||
    (cs.webkitMaskImage && cs.webkitMaskImage !== "none" ? cs.webkitMaskImage : "");

  const clipPath = cs.clipPath && cs.clipPath !== "none" ? cs.clipPath : "";
  const transform = cs.transform && cs.transform !== "none" ? cs.transform : "";
  const overflow =
    cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible"
      ? `${cs.overflow}/${cs.overflowX}/${cs.overflowY}`
      : "";

  const borderRadius = cs.borderRadius && cs.borderRadius !== "0px" ? cs.borderRadius : "";

  const shadowParts = (() => {
    if (!boxShadow) return [];
    // Split on top-level commas (ignore commas inside color functions).
    return boxShadow.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
  })();

  const hasDepthShadow = shadowParts.some((p) => !/\\binset\\b/i.test(p));
  const hasInsetShadow = shadowParts.some((p) => /\\binset\\b/i.test(p));

  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || "",
    className: typeof el.className === "string" ? el.className : "",
    styleAttr: el.getAttribute("style") || "",
    rect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    },
    shadowParts,
    hasDepthShadow,
    hasInsetShadow,
    styles: {
      boxShadow,
      filter,
      backdropFilter,
      maskImage,
      clipPath,
      transform,
      overflow,
      borderRadius,
      position: cs.position || "",
      zIndex: cs.zIndex || "",
    },
  };
}

function isShadowRelevant(summary) {
  if (!summary) return false;
  const s = summary.styles;
  return Boolean(
    s.boxShadow ||
      s.filter ||
      s.backdropFilter ||
      s.maskImage ||
      s.clipPath
  );
}

function scoreCandidate(summary) {
  const s = summary?.styles;
  if (!s) return 0;
  let score = 0;
  if (s.filter) score += /drop-shadow|blur\(/i.test(s.filter) ? 140 : 80;
  if (summary.hasDepthShadow) score += 120;
  if (s.backdropFilter) score += 90;
  if (s.maskImage) score += 60;
  if (s.clipPath) score += 60;
  if (s.transform) score += 25;
  if (s.overflow) score += 20;
  return score;
}

function findOwnerFromPoint(clientX, clientY) {
  const stack = document.elementsFromPoint(clientX, clientY);
  const els = stack.filter((n) => n instanceof HTMLElement);
  const chain = [];

  const top = els[0] || null;
  const candidatesRaw = [];
  let cur = top;
  for (let i = 0; cur && i < 20; i += 1) {
    const sum = summarizeEl(cur);
    if (sum && isShadowRelevant(sum)) {
      candidatesRaw.push({ summary: sum, score: scoreCandidate(sum) });
    }
    cur = cur.parentElement;
  }

  candidatesRaw.sort((a, b) => b.score - a.score);

  // Also capture a small stack for context.
  for (const el of els.slice(0, 10)) {
    const sum = summarizeEl(el);
    if (!sum) continue;
    chain.push(sum);
  }

  const best = candidatesRaw[0] || null;
  const candidates = candidatesRaw.map((c, idx) => ({
    key: `${idx}:${c.summary.tag}:${c.summary.id}:${c.summary.className}`,
    score: c.score,
    summary: c.summary,
  }));

  const bestKey = best ? `0:${best.summary.tag}:${best.summary.id}:${best.summary.className}` : null;
  const bestSummary = best ? best.summary : summarizeEl(top);

  return { candidates, bestKey, bestSummary, chain };
}

export function ShadowScanOverlay({ enabled = false }) {
  const [locked, setLocked] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(() => {
    return getDebugStorageValue("shadowScanPanelCollapsed") === "1";
  });
  const rafRef = useRef(null);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [frameRect, setFrameRect] = useState(null);

  const active = locked || hovered;

  const debugState = useMemo(() => {
    if (typeof window === "undefined") return null;
    return {
      buildProbe: isDebugFlagEnabled("buildProbe", { allowUrl: false }),
      disableDailyCard: isDebugFlagEnabled("disableDailyCard", { allowUrl: false }),
      shadowScan: Boolean(enabled),
      dailyCardShadowOff: isDebugFlagEnabled("dailyCardShadowOff", { allowUrl: false }),
      dailyCardBlurOff: isDebugFlagEnabled("dailyCardBlurOff", { allowUrl: false }),
      dailyCardBorderOff: isDebugFlagEnabled("dailyCardBorderOff", { allowUrl: false }),
      dailyCardMaskOff: isDebugFlagEnabled("dailyCardMaskOff", { allowUrl: false }),
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setFrameRect(null);
      return undefined;
    }

    const updateFrameRect = () => {
      const frame = document.querySelector("[data-app-frame]");
      if (!(frame instanceof HTMLElement)) {
        setFrameRect(null);
        return;
      }
      const r = frame.getBoundingClientRect();
      setFrameRect({
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      });
    };

    updateFrameRect();
    window.addEventListener("resize", updateFrameRect);
    return () => window.removeEventListener("resize", updateFrameRect);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLocked(null);
      setHovered(null);
      return undefined;
    }

    const updateHover = () => {
      rafRef.current = null;
      if (locked) return;
      const { x, y } = lastPointRef.current;
      setHovered(findOwnerFromPoint(x, y));
    };

    const onMove = (e) => {
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(updateHover);
    };

    const onClick = (e) => {
      // Shift+Click locks the current point without triggering underlying UI.
      if (!e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      setLocked(findOwnerFromPoint(e.clientX, e.clientY));
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setLocked(null);
    };

    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled, locked]);

  const chain = active?.chain || [];
  const candidates = active?.candidates || [];

  useEffect(() => {
    if (!enabled) {
      setSelectedKey(null);
      return;
    }

    if (!active) {
      setSelectedKey(null);
      return;
    }

    if (locked) {
      // Keep selection stable while locked unless it's missing.
      setSelectedKey((prev) => prev || active.bestKey || null);
      return;
    }

    setSelectedKey(active.bestKey || null);
  }, [enabled, active, locked]);

  const selected = useMemo(() => {
    if (!candidates.length) return null;
    const hit = candidates.find((c) => c.key === selectedKey);
    return hit || candidates[0] || null;
  }, [candidates, selectedKey]);

  const selectedSummary = selected?.summary || active?.bestSummary || null;

  const copyToClipboard = async (text) => {
    if (typeof window === "undefined") return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // ignore and try fallback
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return Boolean(ok);
    } catch {
      return false;
    }
  };

  const buildReport = () => {
    const now = new Date();
    const slim = (sum) => {
      if (!sum) return null;
      const styleAttr = sum.styleAttr || "";
      return {
        tag: sum.tag,
        id: sum.id,
        className: sum.className,
        rect: sum.rect,
        hasDepthShadow: Boolean(sum.hasDepthShadow),
        hasInsetShadow: Boolean(sum.hasInsetShadow),
        styles: sum.styles,
        // Keep this short to avoid massive paste blobs.
        styleAttr: styleAttr.length > 600 ? `${styleAttr.slice(0, 600)}…` : styleAttr,
      };
    };

    const report = {
      kind: "shadowScanReport",
      ts: now.toISOString(),
      href: typeof window !== "undefined" ? window.location.href : null,
      viewport: typeof window !== "undefined" ? {
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: window.devicePixelRatio,
      } : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      debugState: debugState || null,
      locked: Boolean(locked),
      selectedKey: selectedKey || null,
      picked: slim(selectedSummary),
      candidates: candidates.slice(0, 8).map((c) => ({
        key: c.key,
        score: c.score,
        summary: slim(c.summary),
      })),
      stack: chain.slice(0, 12).map(slim),
    };

    return report;
  };

  const ownerRect = useMemo(() => {
    if (!selectedSummary) return null;
    const r = selectedSummary.rect;
    // Clamp for sanity if something reports huge offscreen bounds.
    const left = Math.max(0, Math.min(window.innerWidth - 1, r.left));
    const top = Math.max(0, Math.min(window.innerHeight - 1, r.top));
    const width = Math.max(0, Math.min(window.innerWidth - left, r.width));
    const height = Math.max(0, Math.min(window.innerHeight - top, r.height));
    return { left, top, width, height };
  }, [selectedSummary]);

  if (!enabled) return null;

  if (typeof document === "undefined") return null;

  const panelLeft = frameRect ? Math.max(12, Math.min(window.innerWidth - 12, frameRect.left + 12)) : 12;
  const panelBottom = frameRect ? Math.max(12, Math.min(window.innerHeight - 12, (window.innerHeight - frameRect.bottom) + 12)) : 12;
  const panelTop = frameRect ? Math.max(12, Math.min(window.innerHeight - 12, frameRect.top + 12)) : 12;
  const panelWidth = Math.min(520, (frameRect ? frameRect.width - 24 : window.innerWidth - 24), window.innerWidth - 24);

  const highlightLayer = (
    <div
      data-shadow-scan-overlay="1"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
      }}
    >
      {ownerRect && (
        <div
          style={{
            position: "fixed",
            left: ownerRect.left,
            top: ownerRect.top,
            width: ownerRect.width,
            height: ownerRect.height,
            border: "2px solid rgba(255, 80, 80, 0.85)",
            borderRadius: 10,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
          }}
        />
      )}
    </div>
  );

  const panelLayer = (
    <div
      data-shadow-scan-panel="1"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "fixed",
          left: panelLeft,
          // When collapsed, dock to the top so it never obscures the card bottom edge.
          bottom: panelCollapsed ? "auto" : panelBottom,
          top: panelCollapsed ? panelTop : "auto",
          width: panelWidth,
          maxHeight: panelCollapsed ? 72 : Math.min(260, window.innerHeight - 24),
          overflow: panelCollapsed ? "hidden" : "auto",
          padding: panelCollapsed ? "8px 10px" : "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255, 80, 80, 0.55)",
          background: "rgba(0,0,0,0.62)",
          color: "rgba(255,255,255,0.92)",
          fontSize: 11,
          letterSpacing: "0.03em",
          lineHeight: 1.3,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ textTransform: "uppercase" }}>
            Debug controls
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                const next = !panelCollapsed;
                setPanelCollapsed(next);
                setDebugStorageValue("shadowScanPanelCollapsed", next ? "1" : "0");
              }}
              style={{
                pointerEvents: "auto",
                background: "rgba(255,255,255,0.08)",
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title={panelCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {panelCollapsed ? "expand" : "collapse"}
            </button>
            <button
              type="button"
              onClick={async () => {
                setCopyStatus("copying");
                const report = buildReport();
                const ok = await copyToClipboard(JSON.stringify(report, null, 2));
                setCopyStatus(ok ? "copied" : "failed");
                window.setTimeout(() => setCopyStatus(null), 1800);
              }}
              style={{
                pointerEvents: "auto",
                background: copyStatus === "copied"
                  ? "rgba(80, 255, 160, 0.18)"
                  : (copyStatus === "failed" ? "rgba(255, 80, 80, 0.22)" : "rgba(255,255,255,0.08)"),
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title="Copy a JSON snapshot (picked element, candidates, stack, debug flags)"
            >
              {copyStatus === "copied" ? "copied" : (copyStatus === "failed" ? "copy failed" : "copy report")}
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  window.dispatchEvent(new CustomEvent("debug:buildProbe", { detail: { enabled: true } }));
                } catch {
                  // ignore
                }
              }}
              style={{
                pointerEvents: "auto",
                background: debugState?.buildProbe ? "rgba(255, 80, 80, 0.22)" : "rgba(255,255,255,0.08)",
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title="Show the top probe banner (session only)"
            >
              show probe
            </button>
            <button
              type="button"
              onClick={() => toggleDebugFlag("disableDailyCard")}
              style={{
                pointerEvents: "auto",
                background: debugState?.disableDailyCard ? "rgba(255, 80, 80, 0.22)" : "rgba(255,255,255,0.08)",
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title="Toggle disableDailyCard (reloads)"
            >
              card off
            </button>
            <button
              type="button"
              onClick={() => toggleDebugFlag("dailyCardShadowOff")}
              style={{
                pointerEvents: "auto",
                background: debugState?.dailyCardShadowOff ? "rgba(255, 80, 80, 0.22)" : "rgba(255,255,255,0.08)",
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title="Toggle dailyCardShadowOff (reloads)"
            >
              shadow off
            </button>
            <button
              type="button"
              onClick={() => toggleDebugFlag("dailyCardBlurOff")}
              style={{
                pointerEvents: "auto",
                background: debugState?.dailyCardBlurOff ? "rgba(255, 80, 80, 0.22)" : "rgba(255,255,255,0.08)",
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title="Toggle dailyCardBlurOff (reloads)"
            >
              blur off
            </button>
            <button
              type="button"
              onClick={() => toggleDebugFlag("dailyCardBorderOff")}
              style={{
                pointerEvents: "auto",
                background: debugState?.dailyCardBorderOff ? "rgba(255, 80, 80, 0.22)" : "rgba(255,255,255,0.08)",
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title="Toggle dailyCardBorderOff (reloads)"
            >
              border off
            </button>
            <button
              type="button"
              onClick={() => toggleDebugFlag("dailyCardMaskOff")}
              style={{
                pointerEvents: "auto",
                background: debugState?.dailyCardMaskOff ? "rgba(255, 80, 80, 0.22)" : "rgba(255,255,255,0.08)",
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title="Toggle dailyCardMaskOff (reloads)"
            >
              mask off
            </button>
            <button
              type="button"
              onClick={resetAllDebugFlags}
              style={{
                pointerEvents: "auto",
                background: "rgba(255,255,255,0.08)",
                color: "inherit",
                border: "1px solid rgba(255, 80, 80, 0.35)",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 10,
              }}
              title="Clears all debug:* localStorage keys (reloads)"
            >
              reset debug
            </button>
          </div>
        </div>

        {panelCollapsed ? (
          <div style={{ marginTop: 6, opacity: 0.85 }}>
            Collapsed and docked top. Click "expand" for details.
          </div>
        ) : (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ textTransform: "uppercase" }}>
                ShadowScan (Shift+Click to lock, Esc to clear)
                {locked ? " | locked" : ""}
              </div>
              <button
                type="button"
                onClick={() => setLocked(null)}
                style={{
                  pointerEvents: "auto",
                  background: "rgba(255,255,255,0.08)",
                  color: "inherit",
                  border: "1px solid rgba(255, 80, 80, 0.35)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: 10,
                }}
              >
                clear lock
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: 8 }}>
          <div style={{ opacity: 0.9, textTransform: "uppercase" }}>Picked</div>
          {selectedSummary ? (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {selectedSummary.tag}
                {selectedSummary.id ? `#${selectedSummary.id}` : ""}
                {selectedSummary.className
                  ? `.${selectedSummary.className.split(/\s+/).filter(Boolean).slice(0, 10).join(".")}${selectedSummary.className.split(/\s+/).filter(Boolean).length > 10 ? ".…" : ""}`
                  : ""}
              </div>
              <div style={{ opacity: 0.8, marginTop: 4, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {selectedSummary.styles.boxShadow ? `box-shadow: ${selectedSummary.styles.boxShadow}` : ""}
                {selectedSummary.styles.filter ? `${selectedSummary.styles.boxShadow ? " | " : ""}filter: ${selectedSummary.styles.filter}` : ""}
                {selectedSummary.styles.backdropFilter ? `${(selectedSummary.styles.boxShadow || selectedSummary.styles.filter) ? " | " : ""}backdrop-filter: ${selectedSummary.styles.backdropFilter}` : ""}
              </div>
              {selectedSummary.styleAttr ? (
                <div style={{ opacity: 0.65, marginTop: 6, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                  {`style="${selectedSummary.styleAttr.length > 220 ? `${selectedSummary.styleAttr.slice(0, 220)}…` : selectedSummary.styleAttr}"`}
                </div>
              ) : (
                <div style={{ opacity: 0.65, marginTop: 6 }}>
                  style attribute: (none)
                </div>
              )}
              <div style={{ opacity: 0.7, marginTop: 4, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {selectedSummary.styles.borderRadius ? `radius: ${selectedSummary.styles.borderRadius} | ` : ""}
                {selectedSummary.styles.overflow ? `overflow: ${selectedSummary.styles.overflow} | ` : ""}
                {selectedSummary.styles.transform ? `transform: ${selectedSummary.styles.transform} | ` : ""}
                {selectedSummary.styles.maskImage ? "mask-image set | " : ""}
                {selectedSummary.styles.clipPath ? "clip-path set | " : ""}
                pos:{selectedSummary.styles.position} z:{selectedSummary.styles.zIndex}
              </div>
            </div>
          ) : (
            <div style={{ opacity: 0.8, marginTop: 4 }}>Move cursor over the jagged area.</div>
          )}
        </div>

        {candidates.length > 1 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ opacity: 0.9, textTransform: "uppercase" }}>Candidates</div>
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {candidates.slice(0, 8).map((c) => {
                const sum = c.summary;
                const activeBtn = c.key === selectedKey;
                const tags = [
                  sum.styles.filter ? "filter" : null,
                  sum.hasDepthShadow ? "shadow" : null,
                  sum.styles.backdropFilter ? "backdrop" : null,
                  sum.styles.maskImage ? "mask" : null,
                  sum.styles.clipPath ? "clip" : null,
                ].filter(Boolean).join("+") || "relevant";

                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedKey(c.key)}
                    style={{
                      pointerEvents: "auto",
                      background: activeBtn ? "rgba(255, 80, 80, 0.22)" : "rgba(255,255,255,0.08)",
                      color: "inherit",
                      border: "1px solid rgba(255, 80, 80, 0.35)",
                      borderRadius: 10,
                      padding: "4px 8px",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontSize: 10,
                    }}
                    title={`${sum.tag}${sum.className ? `.${sum.className}` : ""} | score:${c.score}`}
                  >
                    {tags}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <div style={{ opacity: 0.9, textTransform: "uppercase" }}>Stack (topmost first)</div>
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
            {chain.map((it, idx) => (
              <div key={`${it.tag}:${idx}`} style={{ opacity: isShadowRelevant(it) ? 1 : 0.65 }}>
                <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                  {it.tag}
                  {it.id ? `#${it.id}` : ""}
                  {it.className ? `.${it.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".")}` : ""}
                </div>
                <div style={{ opacity: 0.8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                  {(it.styles.boxShadow || it.styles.filter || it.styles.backdropFilter || it.styles.maskImage || it.styles.clipPath) ? (
                    <span>
                      {it.styles.boxShadow ? "box-shadow" : ""}
                      {it.styles.filter ? `${it.styles.boxShadow ? " + " : ""}filter` : ""}
                      {it.styles.backdropFilter ? `${(it.styles.boxShadow || it.styles.filter) ? " + " : ""}backdrop` : ""}
                      {it.styles.maskImage ? " + mask" : ""}
                      {it.styles.clipPath ? " + clip" : ""}
                    </span>
                  ) : (
                    <span>no shadow/filter</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {highlightLayer}
      {panelLayer}
    </>,
    document.body
  );
}
