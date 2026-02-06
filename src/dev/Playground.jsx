import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import { Background } from "../components/Background.jsx";
import { HomeHub } from "../components/HomeHub.jsx";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { PLAYGROUND_PRESETS } from "./playgroundPresets.js";
import { useUiTuningStore } from "./uiTuningStore.js";
import "./uiTokens.css";
import "../App.css";

const STAGE_OPTIONS = ["Seedling", "Ember", "Flame", "Beacon", "Stellar"];

function Slider({ label, min, max, step, value, onChange }) {
  return (
    <div>
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Playground() {
  const fixtureRef = useRef(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [fixtureWidth, setFixtureWidth] = useState(0);
  const setMode = useDisplayModeStore((s) => s.setMode);
  const setViewportMode = useDisplayModeStore((s) => s.setViewportMode);
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const isLight = colorScheme === "light";
  const isFirefox =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("firefox");
  const outerBackground = isLight
    ? "linear-gradient(135deg, #F5F0E6 0%, #EDE5D8 100%)"
    : "#000";
  const {
    stage,
    layoutMode,
    showBottomLayer,
    selectedPreset,
    tokenOverrides,
    setStage,
    setLayoutMode,
    setShowBottomLayer,
    setToken,
    loadPreset,
    saveCustomPreset,
    reset,
  } = useUiTuningStore();

  const uiVars = useMemo(
    () => ({
      "--card-radius": `${tokenOverrides.cardRadius}px`,
      "--card-border-alpha": tokenOverrides.cardBorderAlpha,
      "--card-border-thickness": `${tokenOverrides.cardBorderThickness}px`,
      "--card-shell-padding": `${tokenOverrides.cardShellPadding}px`,
      "--card-shadow-alpha": tokenOverrides.cardShadowAlpha,
      "--card-shadow-softness": `${tokenOverrides.cardShadowSoftness}px`,
      "--glass-opacity": tokenOverrides.glassOpacity,
      "--glass-blur": `${tokenOverrides.glassBlur}px`,
      "--type-scale": tokenOverrides.typeScale,
      "--avatar-glow-blur": `${tokenOverrides.avatarGlowBlur}px`,
      "--avatar-glow-opacity": tokenOverrides.avatarGlowOpacity,
      "--avatar-vignette-opacity": tokenOverrides.avatarVignetteOpacity,
      "--avatar-lens-opacity": tokenOverrides.avatarLensOpacity,
      "--avatar-bloom-opacity": tokenOverrides.avatarBloomOpacity,
      "--avatar-breath-min": tokenOverrides.avatarBreathMin,
      "--avatar-breath-max": tokenOverrides.avatarBreathMax,
      "--avatar-breath-duration": tokenOverrides.avatarBreathDuration,
    }),
    [tokenOverrides]
  );

  const stageKey = String(stage || "Seedling").toLowerCase();
  const presetOptions = Object.entries(PLAYGROUND_PRESETS);

  const handleExitPlayground = useCallback(() => {
    if (typeof window === "undefined") return;
    const returnPath = sessionStorage.getItem("dev:returnPath") || "/";
    window.location.assign(returnPath);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleExitPlayground();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleExitPlayground]);

  useEffect(() => {
    // Mirror app behavior expectations: components read mode/viewportMode from store.
    setMode(layoutMode);
    setViewportMode(layoutMode);
  }, [layoutMode, setMode, setViewportMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return undefined;
    root.classList.toggle("hearth-viewport", layoutMode === "hearth");
    return () => root.classList.remove("hearth-viewport");
  }, [layoutMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const node = fixtureRef.current;
    if (!node) return undefined;
    const update = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      setFixtureWidth(next);
    };
    update();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(node);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [layoutMode]);

  return (
    <ThemeProvider currentStage={stage}>
      <div className={`ui-playground ui-playground--${layoutMode}`} style={uiVars}>
        <button
          type="button"
          className="ui-playground__fab"
          onClick={() => setControlsOpen((v) => !v)}
        >
          {controlsOpen ? "Close Controls" : "Open Controls"}
        </button>

        {controlsOpen && (
          <button
            type="button"
            className="ui-playground__drawer-backdrop"
            aria-label="Close controls drawer"
            onClick={() => setControlsOpen(false)}
          />
        )}

        <aside className={`ui-playground__drawer ${controlsOpen ? "is-open" : ""}`}>
          <div className="ui-playground__drawer-head">
            <div>
              Controls
              <span className="ui-playground__drawer-probe">BUILD_PROBE: CONTROLS_DRAWER</span>
            </div>
            <button type="button" onClick={() => setControlsOpen(false)}>
              Close
            </button>
          </div>
          <div className="ui-playground__drawer-body">
            <div className="ui-playground__control-field">
              <label>Preset</label>
              <select
                value={selectedPreset}
                onChange={(e) => loadPreset(e.target.value)}
              >
                {presetOptions.map(([id, preset]) => (
                  <option key={id} value={id}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom-draft" disabled>
                  Custom Draft
                </option>
                <option value="custom">Custom Saved</option>
              </select>
            </div>

            <div className="ui-playground__control-field">
              <label>Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="ui-playground__control-field">
              <label>
                Layout <span className="font-mono text-[10px] opacity-80">BUILD_PROBE</span>
              </label>
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value)}
              >
                <option value="hearth">Hearth</option>
                <option value="sanctuary">Sanctuary</option>
              </select>
            </div>

            <div className="ui-playground__control-field">
              <label>
                <input
                  type="checkbox"
                  checked={showBottomLayer}
                  onChange={(e) => setShowBottomLayer(e.target.checked)}
                />{" "}
                Bottom Wallpaper
              </label>
            </div>

            <div className="ui-playground__control-row">
              <button type="button" onClick={saveCustomPreset}>
                Save Custom
              </button>
              <button type="button" onClick={reset}>
                Reset
              </button>
              <button type="button" onClick={handleExitPlayground}>
                Exit Playground
              </button>
            </div>

            <Slider
              label="Card Radius"
              min={12}
              max={40}
              step={1}
              value={tokenOverrides.cardRadius}
              onChange={(v) => setToken("cardRadius", v)}
            />
            <Slider
              label="Border Alpha"
              min={0.05}
              max={0.7}
              step={0.01}
              value={tokenOverrides.cardBorderAlpha}
              onChange={(v) => setToken("cardBorderAlpha", v)}
            />
            <Slider
              label="Glass Opacity"
              min={0.25}
              max={0.9}
              step={0.01}
              value={tokenOverrides.glassOpacity}
              onChange={(v) => setToken("glassOpacity", v)}
            />
            <Slider
              label="Glass Blur"
              min={0}
              max={40}
              step={1}
              value={tokenOverrides.glassBlur}
              onChange={(v) => setToken("glassBlur", v)}
            />
            <Slider
              label="Type Scale"
              min={0.9}
              max={1.2}
              step={0.01}
              value={tokenOverrides.typeScale}
              onChange={(v) => setToken("typeScale", v)}
            />
            <Slider
              label="Avatar Glow Blur"
              min={0}
              max={24}
              step={1}
              value={tokenOverrides.avatarGlowBlur}
              onChange={(v) => setToken("avatarGlowBlur", v)}
            />
            <Slider
              label="Avatar Glow Opacity"
              min={0.05}
              max={1}
              step={0.01}
              value={tokenOverrides.avatarGlowOpacity}
              onChange={(v) => setToken("avatarGlowOpacity", v)}
            />
            <Slider
              label="Avatar Breath Duration"
              min={8}
              max={28}
              step={1}
              value={tokenOverrides.avatarBreathDuration}
              onChange={(v) => setToken("avatarBreathDuration", v)}
            />
          </div>
        </aside>

        <div
          className="min-h-screen w-full flex justify-center overflow-visible transition-colors duration-500 relative"
          style={{ background: outerBackground }}
        >
          <div
            className="fixed inset-y-0 left-0 pointer-events-none z-50 transition-all duration-500"
            style={{
              width:
                layoutMode === "sanctuary"
                  ? "calc((100vw - min(100vw, 820px)) / 2)"
                  : "calc((100vw - min(100vw, 430px)) / 2)",
              background: outerBackground,
            }}
          />
          <div
            className="fixed inset-y-0 right-0 pointer-events-none z-50 transition-all duration-500"
            style={{
              width:
                layoutMode === "sanctuary"
                  ? "calc((100vw - min(100vw, 820px)) / 2)"
                  : "calc((100vw - min(100vw, 430px)) / 2)",
              background: outerBackground,
            }}
          />

          <Background stage={stage} showBottomLayer={showBottomLayer} />

          <div
            ref={fixtureRef}
            data-app-frame
            className={`ui-playground__app-spine relative min-h-screen flex flex-col items-center overflow-visible transition-all duration-500 ${isLight ? "text-[#3D3425]" : "text-white"}`}
            style={
              layoutMode === "sanctuary"
                ? {
                    width: "100%",
                    maxWidth: "820px",
                    boxShadow: "none",
                    overflowX: "hidden",
                    overflowY: "visible",
                    zIndex: 1,
                  }
                : {
                    width: "100%",
                    maxWidth: "430px",
                    boxShadow:
                      "0 0 100px rgba(255, 120, 40, 0.15), 0 0 200px rgba(255, 80, 20, 0.08)",
                    overflowX: "hidden",
                    overflowY: "visible",
                    zIndex: 1,
                  }
            }
          >
            <div
              className="relative z-10 w-full flex flex-col overflow-x-hidden overflow-y-visible"
              style={isFirefox ? { transform: "translateZ(0)" } : undefined}
            >
              <div className="ui-playground__probe">PLAYGROUND BUILD PROBE</div>
              <div className="ui-playground__layout-debug">
                BUILD_PROBE: LAYOUT_WIDTH_DEBUG | mode: {layoutMode} | width: {fixtureWidth}px
              </div>
              <div key="hub" className="section-enter">
                <HomeHub
                  onSelectSection={() => {}}
                  onStageChange={() => {}}
                  currentStage={stage}
                  previewPath={null}
                  previewShowCore={true}
                  previewAttention={"none"}
                  onOpenHardwareGuide={() => {}}
                  isPracticing={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
