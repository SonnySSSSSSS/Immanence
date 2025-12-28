// src/components/avatar/HaloGate.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * HaloGate.jsx
 * Static navigation labels + hit targets around an avatar ring.
 *
 * Constraints satisfied:
 * - Labels + hit targets never rotate (pure absolute positioning in screen space)
 * - Ring remains decorative; external systems can slow it via onHaloStateChange
 * - Default dormant; armed on hover/tap (handled by parent via setHaloState or internal fallback)
 *
 * Props:
 * - enabled: boolean (render nothing if false)
 * - haloState: "idle" | "armed" (optional controlled)
 * - setHaloState: (nextState) => void (optional controlled setter)
 * - onGateSelect: (sectionName) => void (required for interaction)
 * - ringRadiusPx: number (distance from center to ring edge; used to place gates outside ring)
 * - gateOffsetPx: number (how far outside ring to place label/button center)
 * - minHitSizePx: number (touch target size, default 44)
 * - idleOpacity: number (0..1, default 0.12)
 * - armedOpacity: number (0..1, default 1.0)
 * - autoDisarmMs: number | null (optional timeout to return to idle)
 * - onHaloStateChange: (state) => void (optional; call to let ring layer adjust speed)
 */
export default function HaloGate({
    enabled = false,
    haloState: controlledHaloState,
    setHaloState: controlledSetHaloState,
    onGateSelect,
    ringRadiusPx = 132,
    gateOffsetPx = 22,
    minHitSizePx = 44,
    idleOpacity = 0.12,
    armedOpacity = 1.0,
    autoDisarmMs = null,
    onHaloStateChange,
}) {
    const isControlled =
        controlledHaloState === "idle" ||
        controlledHaloState === "armed";

    const [uncontrolledHaloState, setUncontrolledHaloState] = useState("idle");
    const haloState = isControlled ? controlledHaloState : uncontrolledHaloState;
    const setHaloState = isControlled ? controlledSetHaloState : setUncontrolledHaloState;

    const disarmTimerRef = useRef(null);

    // Gate definitions: fixed polar angles (degrees), labels, and section keys.
    const gates = useMemo(
        () => [
            { key: "navigation", label: "NAVIGATION", angleDeg: 45 },
            { key: "application", label: "APPLICATION", angleDeg: 135 },
            { key: "practice", label: "PRACTICE", angleDeg: 225 },
            { key: "wisdom", label: "WISDOM", angleDeg: 315 },
        ],
        []
    );

    // Compute positions in % for an overlay that is position: absolute; inset: 0;
    // We place each gate at (50%,50%) + r*(cos,sin) where r is in px.
    // Parent must ensure HaloGate overlay matches the avatar/ring bounding box.
    const r = ringRadiusPx + gateOffsetPx;

    const opacity = haloState === "armed" ? armedOpacity : idleOpacity;
    const hitTargetsActive = haloState === "armed";

    useEffect(() => {
        if (!enabled) return;
        if (typeof onHaloStateChange === "function") onHaloStateChange(haloState);
    }, [enabled, haloState, onHaloStateChange]);

    // Optional auto-disarm.
    useEffect(() => {
        if (!enabled) return;

        if (disarmTimerRef.current) {
            clearTimeout(disarmTimerRef.current);
            disarmTimerRef.current = null;
        }

        if (haloState === "armed" && typeof autoDisarmMs === "number" && autoDisarmMs > 0) {
            disarmTimerRef.current = setTimeout(() => {
                setHaloState?.("idle");
            }, autoDisarmMs);
        }

        return () => {
            if (disarmTimerRef.current) {
                clearTimeout(disarmTimerRef.current);
                disarmTimerRef.current = null;
            }
        };
    }, [enabled, haloState, autoDisarmMs, setHaloState]);

    if (!enabled) return null;

    const arm = () => setHaloState?.("armed");
    const disarm = () => setHaloState?.("idle");

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 200 }}
            // Desktop hover behavior: parent can also do this, but this is a safe fallback.
            onMouseEnter={arm}
            onMouseLeave={disarm}
        >
            {gates.map((g) => {
                const rad = (g.angleDeg * Math.PI) / 180;

                // We position using CSS calc: 50% + px offset.
                const left = `calc(50% + ${Math.cos(rad) * r}px)`;
                const top = `calc(50% + ${Math.sin(rad) * r}px)`;

                return (
                    <div
                        key={g.key}
                        className="absolute"
                        style={{
                            left,
                            top,
                            transform: "translate(-50%, -50%)",
                            opacity,
                            transition: "opacity 180ms ease",
                        }}
                    >
                        {/* Hit target (invisible) */}
                        <button
                            type="button"
                            aria-label={g.label}
                            className="relative grid place-items-center"
                            style={{
                                width: `${minHitSizePx}px`,
                                height: `${minHitSizePx}px`,
                                pointerEvents: hitTargetsActive ? "auto" : "none",
                                background: "transparent",
                                border: "none",
                                padding: 0,
                                cursor: hitTargetsActive ? "pointer" : "default",
                            }}
                            onClick={() => {
                                // Selecting a gate disarms immediately, then triggers scroll.
                                disarm();
                                if (typeof onGateSelect === "function") onGateSelect(g.key);
                            }}
                            onTouchStart={() => {
                                // Mobile: first tap can be used to arm (if dormant).
                                // If already armed, let click proceed normally.
                                if (haloState !== "armed") arm();
                            }}
                        >
                            {/* Label (static text) */}
                            <span
                                className="select-none"
                                style={{
                                    fontSize: "12px",
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    // Keep it visually present but not loud; your theme can override this later.
                                    color: "rgba(30, 70, 55, 0.92)",
                                    textShadow: "0 1px 0 rgba(255,255,255,0.35)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {g.label}
                            </span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
