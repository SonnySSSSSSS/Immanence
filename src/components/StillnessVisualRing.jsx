import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { RainbowPresetCanvas } from './rainbowPreset/RainbowPresetCanvas.jsx';
import ParticleCountdownPreset from './countdown/ParticleCountdownPreset.jsx';
import { PRODUCTION_RING_DEFAULTS } from './bloomRing/bloomRingProductionDefaults.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { BREATH_RING_PRESETS } from './breathingRingPresets.js';
import { PersistentBreathRingCanvas } from './BreathingRing.jsx';

const RING_MODE_CYCLE = BREATH_RING_PRESETS.map((preset) => preset.id);

function normalizeRingMode(mode) {
  if (mode === 'countdown') return 'orb';
  if (mode === 'baseline' || mode === 'base') return 'bracelet';
  return RING_MODE_CYCLE.includes(mode) ? mode : null;
}

function formatStillnessClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function StillnessVisualRing({ stillnessVisual, practiceActive = true }) {
  const theme = useTheme();
  const liveAccentColor = theme?.accent?.primary ?? "#22d3ee";
  const segmentType = stillnessVisual?.segmentType || "focus";
  const segmentLabel = stillnessVisual?.segmentLabel || "FOCUS";
  const nextSegmentLabel = stillnessVisual?.nextSegmentLabel || "REST";
  const segmentDurationSec = Math.max(1, Number(stillnessVisual?.segmentDurationSec) || 1);
  const segmentProgress01 = Math.max(0, Math.min(1, Number(stillnessVisual?.segmentProgress01) || 0));
  const cycleProgress01 = Math.max(0, Math.min(1, Number(stillnessVisual?.cycleProgress01) || 0));
  const segmentRemainingSec = Math.max(0, Math.ceil(Number(stillnessVisual?.segmentRemainingSec) || 0));
  const totalRemainingSec = Math.max(0, Math.ceil(Number(stillnessVisual?.totalRemainingSec) || 0));
  const intensity = String(stillnessVisual?.intensity || "medium").toUpperCase();
  const intensityCopy = stillnessVisual?.intensityCopy || "";
  const supportInfoDetached = Boolean(stillnessVisual?.supportInfoDetached);
  const suppressSupportBox = Boolean(stillnessVisual?.suppressSupportBox);
  const isPaused = Boolean(stillnessVisual?.isPaused);
  const normalizedMode = normalizeRingMode(stillnessVisual?.ringMode) || "instrument";
  const isOrb = normalizedMode === "orb";
  const presetOwnsCenterDigit = normalizedMode === "polygon" || isOrb;
  const useDetachedAuxText = normalizedMode === "polygon" || normalizedMode === "rainbow" || isOrb;
  const showArcPhaseLabel = false;
  const ringSafePad = "20px";
  const phaseForRenderer = segmentType === "focus" ? "inhale" : "exhale";
  const phaseProgressForRenderer = segmentType === "focus"
    ? segmentProgress01
    : 1 - segmentProgress01;
  const breathDriver = useMemo(() => ({
    phase: phaseForRenderer,
    cycleProgress01,
    phaseProgress01: Math.max(0, Math.min(1, phaseProgressForRenderer)),
    phaseDurationSec: segmentDurationSec,
    cycleDurationSec: Math.max(0.1, Number(stillnessVisual?.visualCycleDurationSec) || segmentDurationSec),
    isPaused,
  }), [
    cycleProgress01,
    isPaused,
    phaseForRenderer,
    phaseProgressForRenderer,
    segmentDurationSec,
    stillnessVisual?.visualCycleDurationSec,
  ]);
  const productionParams = useMemo(() => ({
    ...PRODUCTION_RING_DEFAULTS,
    breathDriver,
  }), [breathDriver]);
  const stagePlateRef = useRef(null);
  const [stagePlateSize, setStagePlateSize] = useState({ width: 0, height: 0 });
  const [orbDigitTargetPx, setOrbDigitTargetPx] = useState(360);

  useLayoutEffect(() => {
    const el = stagePlateRef.current;
    if (!el) return undefined;

    let rafId = null;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || 0;
      const h = rect.height || 0;

      setStagePlateSize((prev) => (
        Math.abs(prev.width - w) < 0.5 && Math.abs(prev.height - h) < 0.5
          ? prev
          : { width: w, height: h }
      ));

      if (h > 0) {
        setOrbDigitTargetPx(Math.max(180, Math.min(560, h * 0.52)));
      }
    };

    const scheduleMeasure = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, []);

  const ringStageSize = Math.max(
    180,
    Math.min(
      300,
      (stagePlateSize.width || 520) * 0.58,
      (stagePlateSize.height || 560) * 0.64
    )
  );
  const segmentDisplay = segmentRemainingSec > 59
    ? formatStillnessClock(segmentRemainingSec)
    : String(segmentRemainingSec);

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "#020207",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={stagePlateRef}
          style={{
            width: "100%",
            margin: 0,
            padding: isOrb ? "0" : "clamp(12px, 3vh, 40px) 14px clamp(10px, 2vh, 24px)",
            borderRadius: 0,
            background: "transparent",
            border: "none",
            boxShadow: "none",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            position: "relative",
            overflow: "visible",
            isolation: "isolate",
            minHeight: 0,
            height: isOrb ? "100%" : "min(100%, 560px)",
            maxHeight: isOrb ? "none" : "560px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              background: "#020207",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              overflow: "visible",
              pointerEvents: normalizedMode === "rainbow" ? "auto" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: `${ringStageSize}px`,
                height: `${ringStageSize}px`,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--accent-color) 18%, transparent) 0%, rgba(0,0,0,0) 72%)",
                opacity: segmentType === "focus" ? 0.18 : 0.1,
                zIndex: 5,
                pointerEvents: "none",
              }}
            />

            <div
              className="relative"
              style={{
                position: "relative",
                width: normalizedMode === "rainbow" ? "100%" : `${ringStageSize}px`,
                height: normalizedMode === "rainbow" ? "100%" : `${ringStageSize}px`,
                overflow: "visible",
                marginTop: 0,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: normalizedMode === "rainbow" ? 0 : `calc(-1 * ${ringSafePad})`,
                  overflow: "visible",
                  WebkitMaskImage: normalizedMode === "rainbow" ? "none" : "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
                  maskImage: normalizedMode === "rainbow" ? "none" : "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  pointerEvents: normalizedMode === "rainbow" ? "auto" : "none",
                }}
              >
                {normalizedMode === 'bracelet' && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: `${Math.round(ringStageSize * 0.78) + 16}px`,
                      height: `${Math.round(ringStageSize * 0.78) + 16}px`,
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      zIndex: 6,
                      pointerEvents: 'none',
                    }}
                  >
                    <img
                      src="/assets/ancient_relic_focus.webp"
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        display: 'block',
                      }}
                    />
                  </div>
                )}

                {!isOrb && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: ringSafePad,
                      zIndex: 7,
                      pointerEvents: "none",
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.46) 34%, rgba(0,0,0,0.22) 58%, rgba(0,0,0,0.00) 82%)",
                      opacity: 0.85,
                    }}
                  />
                )}

                {normalizedMode !== "rainbow" && !isOrb && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "hidden",
                      zIndex: 10,
                      pointerEvents: "none",
                      minWidth: "1px",
                      minHeight: "1px",
                      opacity: isOrb ? 0 : (practiceActive ? 1 : 0),
                      transition: "opacity 0.25s ease",
                    }}
                  >
                    <PersistentBreathRingCanvas
                      rndRingMode={normalizedMode}
                      frameloop={isOrb ? "never" : undefined}
                      productionParams={productionParams}
                      liveAccentColor={liveAccentColor}
                      breathDriver={breathDriver}
                      style={{ width: "100%", height: "100%", minWidth: "1px", minHeight: "1px", display: "block" }}
                      isFrameActive={practiceActive}
                      displayNumber={segmentRemainingSec}
                      presetVariant={normalizedMode === "bracelet" ? "preset1" : "other"}
                      activePresetRaw={normalizedMode}
                      activePresetLabel={normalizedMode}
                      normalizedPresetNumber={null}
                    />
                  </div>
                )}

                {normalizedMode === "rainbow" && practiceActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "auto",
                      background: "transparent",
                      zIndex: 25,
                    }}
                  >
                    <RainbowPresetCanvas breathDriver={breathDriver} quality="stillness" />
                  </div>
                )}

                {!showArcPhaseLabel && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 30,
                      pointerEvents: "none",
                      padding: "0px",
                      borderRadius: 0,
                      width: "min(72%, 240px)",
                      textAlign: "center",
                    }}
                  >
                    {!useDetachedAuxText && (
                      <div
                        style={{
                          textTransform: "uppercase",
                          color: "var(--accent-primary)",
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(1.6rem, 5vw, 1.9rem)",
                          fontWeight: 400,
                          letterSpacing: "0.24em",
                          opacity: 0.88,
                          textShadow: "0 2px 12px rgba(0,0,0,0.58)",
                        }}
                      >
                        {isPaused ? "Paused" : segmentLabel}
                      </div>
                    )}
                    {!presetOwnsCenterDigit && (
                      <div
                        style={{
                          fontSize: "clamp(2.8rem, 9vw, 3.4rem)",
                          fontWeight: 300,
                          fontFamily: "var(--font-display)",
                          color: "var(--accent-primary)",
                          marginTop: "6px",
                          textShadow: "0 2px 10px rgba(0,0,0,0.50)",
                          opacity: 0.92,
                          lineHeight: 1,
                        }}
                      >
                        {segmentDisplay}
                      </div>
                    )}
                    {!useDetachedAuxText && (
                      <>
                        <div
                          style={{
                            marginTop: "8px",
                            color: "rgba(245,245,245,0.7)",
                            fontFamily: "var(--font-display)",
                            fontSize: "0.78rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            textShadow: "0 2px 8px rgba(0,0,0,0.46)",
                            lineHeight: 1.35,
                          }}
                        >
                          {isPaused ? "Phase timing paused" : `Next ${nextSegmentLabel} in ${segmentRemainingSec}s`}
                        </div>
                        {segmentType === "focus" && !supportInfoDetached && (
                          <>
                            <div
                              style={{
                                marginTop: "10px",
                                color: "rgba(245,245,245,0.82)",
                                fontFamily: "var(--font-display)",
                                fontSize: "0.74rem",
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                              }}
                            >
                              {intensity}
                            </div>
                            <div
                              style={{
                                marginTop: "4px",
                                color: "rgba(245,245,245,0.64)",
                                fontSize: "0.88rem",
                                lineHeight: 1.3,
                              }}
                            >
                              {intensityCopy}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {useDetachedAuxText && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `calc(50% - ${Math.round(ringStageSize / 2)}px - 38px)`,
                transform: "translateX(-50%)",
                zIndex: 34,
                pointerEvents: "none",
                textTransform: "uppercase",
                color: "var(--accent-primary)",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.45rem, 4.8vw, 1.8rem)",
                fontWeight: 400,
                letterSpacing: "0.24em",
                opacity: 0.9,
                textShadow: "0 2px 12px rgba(0,0,0,0.58)",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {isPaused ? "Paused" : segmentLabel}
            </div>
          )}

          {useDetachedAuxText && !suppressSupportBox && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "calc(54px + env(safe-area-inset-bottom))",
                transform: "translateX(-50%)",
                zIndex: 35,
                pointerEvents: "none",
                width: "min(82vw, 320px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px 14px",
                borderRadius: "18px",
                background: "rgba(2, 6, 14, 0.52)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "rgba(245,245,245,0.74)",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textShadow: "0 2px 8px rgba(0,0,0,0.46)",
                  lineHeight: 1.35,
                }}
              >
                {isPaused ? "Phase timing paused" : `Next ${nextSegmentLabel} in ${segmentRemainingSec}s`}
              </div>
              {segmentType === "focus" && !supportInfoDetached && (
                <>
                  <div
                    style={{
                      color: "rgba(245,245,245,0.82)",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.74rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    {intensity}
                  </div>
                  <div
                    style={{
                      color: "rgba(245,245,245,0.66)",
                      fontSize: "0.92rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {intensityCopy}
                  </div>
                </>
              )}
            </div>
          )}

          {isOrb && (
            <div style={{
              position: "absolute",
              inset: -1,
              zIndex: 15,
              opacity: practiceActive ? 1 : 0,
              pointerEvents: "none",
              transition: "opacity 0.25s ease",
            }}>
              <ParticleCountdownPreset
                digitTargetPx={orbDigitTargetPx}
                displayNumber={segmentRemainingSec}
                accentColor={liveAccentColor}
                frameloop={isOrb ? "always" : "never"}
              />
            </div>
          )}

          {isOrb && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "18%",
                zIndex: 16,
                pointerEvents: "none",
                background: "linear-gradient(180deg, rgba(2,6,14,0) 0%, rgba(2,6,14,0.58) 72%, #020207 100%)",
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "calc(6px + env(safe-area-inset-bottom))",
              zIndex: 36,
              pointerEvents: "none",
              paddingLeft: "14px",
              paddingRight: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                rowGap: "4px",
                fontSize: "0.88rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                color: "rgba(245,245,245,0.68)",
                textShadow: "0 2px 8px rgba(0,0,0,0.46)",
                padding: "6px 12px",
                borderRadius: "999px",
                background: "rgba(2, 6, 14, 0.56)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              <span>Total</span>
              <span style={{ color: "var(--accent-secondary)" }}>{formatStillnessClock(totalRemainingSec)}</span>
              {isPaused && <span style={{ opacity: 0.55 }}>• PAUSED</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
