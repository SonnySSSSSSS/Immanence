import React, { useLayoutEffect, useRef, useState } from "react";

/**
 * CrossfadePanels
 * - No reflow during fade
 * - Wrapper height is locked to incoming panel BEFORE fade starts
 *
 * Usage:
 * <CrossfadePanels
 *   activeKey={activeTab}
 *   render={(key) => key === "paths" ? <PathsPanel /> : <CodexPanel />}
 * />
 */
export function CrossfadePanels({
    activeKey,
    render,
    fadeMs = 2000,
    heightMs = 250,
    className = "",
}) {
    const [prevKey, setPrevKey] = useState(activeKey);
    const [phase, setPhase] = useState("idle"); // "idle" | "measuring" | "fading"
    const [lockedHeight, setLockedHeight] = useState(null);

    const incomingRef = useRef(null);
    const wrapperRef = useRef(null);
    const timeoutRef = useRef(null);

    const isSwitch = activeKey !== prevKey;

    // Mount incoming + measure BEFORE fade starts
    useLayoutEffect(() => {
        if (!isSwitch) return;

        setPhase("measuring");

        // Wait a frame so DOM paints
        requestAnimationFrame(() => {
            const incomingEl = incomingRef.current;
            if (!incomingEl) return;

            const h = incomingEl.getBoundingClientRect().height;
            setLockedHeight(Math.ceil(h));

            // Start fade next frame so height is already locked
            requestAnimationFrame(() => {
                setPhase("fading");

                // End: commit active -> prev
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = window.setTimeout(() => {
                    setPrevKey(activeKey);
                    setPhase("idle");
                }, fadeMs);
            });
        });

        return () => window.clearTimeout(timeoutRef.current);
    }, [activeKey, isSwitch, fadeMs]);

    const heightStyle =
        lockedHeight != null
            ? {
                height: `${lockedHeight}px`,
                transition: heightMs > 0 ? `height ${heightMs}ms ease` : "none",
                overflow: "hidden",
            }
            : {
                height: "auto",
                overflow: "visible",
            };

    const basePanelStyle = {
        position: "absolute",
        inset: 0,
        width: "100%",
    };

    const outgoingOpacity = phase === "fading" ? 0 : 1;
    const incomingOpacity = phase === "fading" ? 1 : 0;

    return (
        <div
            ref={wrapperRef}
            className={className}
            style={{
                position: "relative",
                ...heightStyle,
            }}
        >
            {/* Outgoing (prevKey) - relative when idle, absolute during switch */}
            <div
                style={{
                    // Use relative position when idle so content contributes to height
                    // Use absolute only during switch for the crossfade overlay
                    position: isSwitch ? "absolute" : "relative",
                    ...(isSwitch ? { inset: 0, width: "100%" } : {}),
                    opacity: isSwitch ? outgoingOpacity : 1,
                    transition: `opacity ${fadeMs}ms ease`,
                    pointerEvents: isSwitch ? "none" : "auto",
                }}
                aria-hidden={isSwitch ? true : false}
            >
                {render(prevKey)}
            </div>

            {/* Incoming (activeKey) – mounted only when switching */}
            {isSwitch && (
                <div
                    ref={incomingRef}
                    style={{
                        ...basePanelStyle,
                        opacity: incomingOpacity,
                        transition: `opacity ${fadeMs}ms ease`,
                        pointerEvents: phase === "fading" ? "auto" : "none",
                    }}
                >
                    {render(activeKey)}
                </div>
            )}
        </div>
    );
}
