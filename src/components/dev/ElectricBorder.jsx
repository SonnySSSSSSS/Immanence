import { useEffect, useState } from "react";

// ─── Reduced-motion detection ─────────────────────────────────────────────────
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(Boolean(media.matches));
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

// ─── One-time CSS keyframe injection ─────────────────────────────────────────
// Injecting once avoids duplicated <style> tags across multiple instances.
let _kfInjected = false;
function ensureKeyframes() {
  if (_kfInjected || typeof document === "undefined") return;
  _kfInjected = true;
  const style = document.createElement("style");
  style.dataset.id = "electric-border-kf";
  style.textContent = `
    @keyframes electricBorderPulse {
      0%   { opacity: 0.50; }
      40%  { opacity: 1;    }
      60%  { opacity: 0.95; }
      100% { opacity: 0.50; }
    }
  `;
  document.head.appendChild(style);
}

// ─── ElectricBorder (CSS-only, no <canvas>) ──────────────────────────────────
//
// ROOT CAUSE FIX: The previous implementation used canvas.getContext("2d") with
// ctx.shadowBlur + requestAnimationFrame, creating one GPU-composited texture
// per overlay instance. When multiple ElectricBorder instances ran alongside the
// WebGL bloom-ring canvas, GPU memory exhaustion triggered WebGL context loss.
//
// This implementation uses a plain <div> with CSS border + box-shadow.
// ✓ No additional <canvas> — no GPU texture per overlay
// ✓ No per-frame allocations
// ✓ CSS animation handles the pulse (single keyframe, browser-optimised)
// ✓ Props API is identical — all callers are unaffected.
//
// Props:
//   width, height   – outer container size (informational; sizing is by caller div)
//   innerRect       – { x, y, width, height, radius } where to place the border
//   color           – CSS color string (rgba preferred)
//   speed           – animation cycles per second (0 = static)
//   chaos           – controls glow spread (higher → wider glow)
//   thickness       – border width in px
//   showSparks      – accepted but ignored (visual parity not required for dev tools)

export function ElectricBorder({
  innerRect,
  color = "rgba(255, 210, 120, 1)",
  speed = 0.06,
  chaos = 0.12,
  thickness = 2,
  // width, height, showSparks are accepted for API compatibility but unused in the CSS impl.
  // eslint-disable-next-line no-unused-vars
  width, height, showSparks, // noqa
}) {
  const prefersReduced = usePrefersReducedMotion();
  const effectiveSpeed = prefersReduced ? 0 : speed;

  // Inject CSS keyframes once per page load.
  useEffect(() => { ensureKeyframes(); }, []);

  if (!innerRect) return null;

  // Map chaos → glow radii (mirrors old canvas shadowBlur scaling).
  const outerGlow = Math.round(4 + chaos * 22);
  const innerGlow = Math.round(2 + chaos * 8);

  const shadow = [
    `0 0 ${outerGlow}px ${color}`,
    `0 0 ${innerGlow}px ${color}`,
    `inset 0 0 ${innerGlow}px ${color}`,
  ].join(", ");

  // Animation period: speed = cycles/sec → period = 1/speed seconds.
  const animDuration = effectiveSpeed > 0
    ? `${(1 / effectiveSpeed).toFixed(2)}s`
    : "0s";

  const borderStyle = {
    position: "absolute",
    left: innerRect.x,
    top: innerRect.y,
    width: innerRect.width,
    height: innerRect.height,
    borderRadius: innerRect.radius,
    border: `${thickness}px solid ${color}`,
    boxShadow: shadow,
    pointerEvents: "none",
    animation: effectiveSpeed > 0
      ? `electricBorderPulse ${animDuration} ease-in-out infinite`
      : "none",
    opacity: 0.82,
  };

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={borderStyle} />
    </div>
  );
}

export default ElectricBorder;
