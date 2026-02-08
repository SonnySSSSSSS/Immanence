import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import App from "../App.jsx";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useDevOverrideStore } from "./devOverrideStore.js";
import { PLAYGROUND_PRESETS } from "./playgroundPresets.js";
import { useUiTuningStore } from "./uiTuningStore.js";
import "./uiTokens.css";

const STAGE_OPTIONS = ["Seedling", "Ember", "Flame", "Beacon", "Stellar"];

export function Playground() {
  const [controlsOpen, setControlsOpen] = useState(false);
  const [frameWidth, setFrameWidth] = useState(0);
  const exitingRef = useRef(false);
  const syncingFromLayoutRef = useRef(false);

  const displayMode = useDisplayModeStore((s) => s.mode);
  const viewportMode = useDisplayModeStore((s) => s.viewportMode);
  const setMode = useDisplayModeStore((s) => s.setMode);
  const setViewportMode = useDisplayModeStore((s) => s.setViewportMode);

  const {
    stage,
    layoutMode,
    showBottomLayer,
    selectedPreset,
    setStage,
    setLayoutMode,
    setShowBottomLayer,
    loadPreset,
    saveCustomPreset,
    reset,
  } = useUiTuningStore();

  const overrideStage = useDevOverrideStore((s) => s.stage);
  const overridePath = useDevOverrideStore((s) => s.avatarPath);
  const setOverrideStage = useDevOverrideStore((s) => s.setStage);
  const setOverridePath = useDevOverrideStore((s) => s.setAvatarPath);
  const setOverrideLayoutMode = useDevOverrideStore((s) => s.setLayoutMode);
  const captureSnapshot = useDevOverrideStore((s) => s.captureSnapshot);
  const restoreSnapshot = useDevOverrideStore((s) => s.restoreSnapshot);
  const activatePlayground = useDevOverrideStore((s) => s.activatePlayground);
  const deactivatePlayground = useDevOverrideStore((s) => s.deactivatePlayground);

  const presetOptions = Object.entries(PLAYGROUND_PRESETS);
  const initialSnapshotRef = useRef(null);
  const initialUiStateRef = useRef(null);

  if (initialSnapshotRef.current == null) {
    initialSnapshotRef.current = {
      mode: displayMode,
      viewportMode,
      previewStage: overrideStage || stage,
      previewPath: overridePath,
    };
  }

  if (initialUiStateRef.current == null) {
    initialUiStateRef.current = {
      layoutMode,
      stage,
    };
  }

  const applyRestoredSnapshot = useCallback(
    (snapshot) => {
      if (!snapshot) return;
      const restoredMode =
        snapshot.mode === "sanctuary" || snapshot.mode === "hearth"
          ? snapshot.mode
          : "hearth";
      const restoredStage = snapshot.previewStage || "Seedling";
      const restoredPath = snapshot.previewPath ?? null;
      setMode(restoredMode);
      setViewportMode(snapshot.viewportMode || restoredMode);
      setLayoutMode(restoredMode);
      setOverrideLayoutMode(restoredMode);
      setStage(restoredStage);
      setOverrideStage(restoredStage);
      setOverridePath(restoredPath);
    },
    [
      setLayoutMode,
      setMode,
      setOverrideLayoutMode,
      setOverridePath,
      setOverrideStage,
      setStage,
      setViewportMode,
    ]
  );

  const restorePlaygroundState = useCallback(() => {
    const snapshot = restoreSnapshot();
    applyRestoredSnapshot(snapshot);
    deactivatePlayground();
  }, [applyRestoredSnapshot, deactivatePlayground, restoreSnapshot]);

  const handleExitPlayground = useCallback(() => {
    if (typeof window === "undefined") return;
    exitingRef.current = true;
    restorePlaygroundState();
    const returnPath = sessionStorage.getItem("dev:returnPath") || "/";
    window.location.assign(returnPath);
  }, [restorePlaygroundState]);

  useEffect(() => {
    const snapshot = initialSnapshotRef.current;
    const initialUiState = initialUiStateRef.current;
    captureSnapshot(snapshot);
    activatePlayground(snapshot);

    syncingFromLayoutRef.current = true;
    setOverrideLayoutMode(initialUiState.layoutMode);
    setMode(initialUiState.layoutMode);
    setViewportMode(initialUiState.layoutMode);
    setOverrideStage(initialUiState.stage);

    return () => {
      if (!exitingRef.current) {
        restorePlaygroundState();
      }
    };
  }, [
    activatePlayground,
    captureSnapshot,
    restorePlaygroundState,
    setMode,
    setOverrideLayoutMode,
    setOverrideStage,
    setViewportMode,
  ]);

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

  // Drawer -> app mode/stage
  useEffect(() => {
    syncingFromLayoutRef.current = true;
    setMode(layoutMode);
    setViewportMode(layoutMode);
    setOverrideLayoutMode(layoutMode);
  }, [layoutMode, setMode, setOverrideLayoutMode, setViewportMode]);

  useEffect(() => {
    setOverrideStage(stage);
  }, [setOverrideStage, stage]);

  // App -> drawer mode two-way sync (WidthToggle can change it)
  useEffect(() => {
    if (syncingFromLayoutRef.current) {
      syncingFromLayoutRef.current = false;
      return;
    }
    if (displayMode !== layoutMode) {
      setLayoutMode(displayMode);
      setOverrideLayoutMode(displayMode);
    }
  }, [displayMode, layoutMode, setLayoutMode, setOverrideLayoutMode]);

  // DevPanel <-> drawer stage sync through shared override store
  useEffect(() => {
    if (overrideStage !== stage) {
      setStage(overrideStage);
    }
  }, [overrideStage, setStage, stage]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let ro = null;
    let rafId = null;
    let active = true;

    const bindFrameObserver = () => {
      if (!active) return;
      const frameNode = document.querySelector("[data-app-frame]");
      if (!frameNode) {
        rafId = window.requestAnimationFrame(bindFrameObserver);
        return;
      }
      const update = () => {
        const next = Math.round(frameNode.getBoundingClientRect().width);
        setFrameWidth(next);
      };
      update();
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(update);
        ro.observe(frameNode);
      } else {
        window.addEventListener("resize", update);
      }
    };

    bindFrameObserver();
    return () => {
      active = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (ro) {
        ro.disconnect();
      }
    };
  }, []);

  const debugLine = useMemo(
    () =>
      `BUILD_PROBE: LAYOUT_WIDTH_DEBUG | mode:${layoutMode} | viewport:${viewportMode} | width:${frameWidth}px`,
    [frameWidth, layoutMode, viewportMode]
  );

  return (
    <div className="ui-playground">
      <App playgroundMode playgroundBottomLayer={showBottomLayer} />

      <div className="ui-playground__layout-debug ui-playground__layout-debug--overlay">
        {debugLine}
      </div>

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
            <select value={selectedPreset} onChange={(e) => loadPreset(e.target.value)}>
              {presetOptions.map(([id, preset]) => (
                <option key={id} value={id}>
                  {preset.label}
                </option>
              ))}
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
            <label>Layout</label>
            <select value={layoutMode} onChange={(e) => setLayoutMode(e.target.value)}>
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
        </div>
      </aside>
    </div>
  );
}
