import React, { useCallback, useEffect, useRef, useState } from "react";
import { isDevtoolsEnabled } from "../../dev/uiDevtoolsGate.js";
import { getAllPlatesFxPresets, resolvePlatesFxPreset, subscribePlatesFxPresets } from "../../dev/plateFxPresets.js";
import { useSettingsStore } from "../../state/settingsStore.js";
import { useTheme } from "../../context/ThemeContext.jsx";

const PICK_STORAGE_KEY = "immanence.dev.platesFxPicker";
const PICK_EVENT = "immanence-plates-fx-picker";
const SURFACE_CLASS = "ui-accent-plate";
const CANONICAL_PLATE_IDS = [
  "homeHub:plate:mode:practice",
  "homeHub:plate:mode:wisdom",
  "homeHub:plate:mode:application",
  "homeHub:plate:mode:navigation",
  "practice:plate:submode:cognitive",
  "practice:plate:submode:somatic",
  "practice:plate:submode:emotion",
];
const STYLE_KEYS = [
  "--plate-bw",
  "--plate-speed",
  "--plate-border-opacity",
  "--plate-glow",
  "--plate-glow-opacity",
  "--plate-bg-opacity",
  "--plate-sheen",
  "--plate-anim-name",
  "--plate-c1",
  "--plate-c2",
  "--plate-c3",
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseHex(hex) {
  const normalized = String(hex || "").trim().replace("#", "");
  if (!/^[\da-f]{3}$|^[\da-f]{6}$/i.test(normalized)) return null;
  const full = normalized.length === 3
    ? normalized.split("").map((c) => `${c}${c}`).join("")
    : normalized;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if (![r, g, b].every(Number.isFinite)) return null;
  return { r, g, b };
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = 60 * (((gn - bn) / delta) % 6);
        break;
      case gn:
        h = 60 * ((bn - rn) / delta + 2);
        break;
      default:
        h = 60 * ((rn - gn) / delta + 4);
        break;
    }
  }
  return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }) {
  const sat = clamp(s, 0, 100) / 100;
  const lit = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lit - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const toHex = (n) => clamp(Math.round((n + m) * 255), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

function shiftHsl(base, { h = 0, s = 0, l = 0 }) {
  return {
    h: (base.h + h + 360) % 360,
    s: clamp(base.s + s, 0, 100),
    l: clamp(base.l + l, 0, 100),
  };
}

function deriveColorTriplet(baseColor) {
  const parsed = parseHex(baseColor);
  const safeBase = parsed ? rgbToHsl(parsed) : rgbToHsl({ r: 255, g: 210, b: 120 });
  return {
    c1: hslToHex(shiftHsl(safeBase, { h: 10, s: 6, l: 9 })),
    c2: hslToHex(shiftHsl(safeBase, { h: -14, s: 10, l: -5 })),
    c3: hslToHex(shiftHsl(safeBase, { h: 28, s: 2, l: 12 })),
  };
}

function readPickConfig() {
  if (typeof window === "undefined") return { selectedId: null };
  try {
    const raw = window.localStorage.getItem(PICK_STORAGE_KEY);
    if (!raw) return { selectedId: null };
    const parsed = JSON.parse(raw);
    return {
      selectedId: typeof parsed?.selectedId === "string" && parsed.selectedId.length ? parsed.selectedId : null,
    };
  } catch {
    return { selectedId: null };
  }
}

export function SelectedPlateOverlay() {
  const enabled = useSettingsStore((s) => Boolean(s.platesFxEnabled));
  const [pickConfig, setPickConfig] = useState(() => readPickConfig());
  const appliedIdsRef = useRef(new Set());
  const theme = useTheme();
  const stageBaseColor = theme?.accent?.primary || "#FFD278";

  const clearPlateStyles = useCallback((el) => {
    if (!(el instanceof Element)) return;
    el.classList.remove(SURFACE_CLASS);
    for (const key of STYLE_KEYS) el.style.removeProperty(key);
  }, []);

  const applyPlateStyles = useCallback((el, resolvedPreset, rawPreset = {}) => {
    if (!(el instanceof Element)) return;
    const baseColor = resolvedPreset.colorMode === "custom" && resolvedPreset.color
      ? resolvedPreset.color
      : stageBaseColor;
    const triplet = deriveColorTriplet(baseColor);
    el.classList.add(SURFACE_CLASS);
    el.style.setProperty("--plate-bw", `${resolvedPreset.effective.borderW}px`);
    el.style.setProperty("--plate-speed", `${resolvedPreset.effective.speed}s`);
    el.style.setProperty("--plate-border-opacity", `${resolvedPreset.effective.opacity}`);
    el.style.setProperty("--plate-glow", `${resolvedPreset.effective.glow}px`);
    el.style.setProperty("--plate-glow-opacity", `${resolvedPreset.effective.glowOpacity}`);
    el.style.setProperty("--plate-bg-opacity", `${resolvedPreset.effective.bgOpacity}`);
    el.style.setProperty("--plate-sheen", resolvedPreset.effective.sheen ? "1" : "0");

    // Reduced motion support: check raw preset for explicit override
    const hasExplicitAnimate = rawPreset.animate !== null && rawPreset.animate !== undefined;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = hasExplicitAnimate
      ? resolvedPreset.effective.animate
      : (resolvedPreset.effective.animate && !prefersReduced);

    el.style.setProperty("--plate-anim-name", shouldAnimate ? "plateFlow" : "none");
    el.style.setProperty("--plate-c1", triplet.c1);
    el.style.setProperty("--plate-c2", triplet.c2);
    el.style.setProperty("--plate-c3", triplet.c3);
  }, [stageBaseColor]);

  const applyAll = useCallback(() => {
    const allPresets = getAllPlatesFxPresets();
    const activeIds = new Set([
      ...CANONICAL_PLATE_IDS,
      ...Object.keys(allPresets || {}),
      ...(pickConfig?.selectedId ? [pickConfig.selectedId] : []),
      ...Array.from(appliedIdsRef.current),
    ]);

    for (const plateId of activeIds) {
      if (!plateId || typeof plateId !== "string") continue;
      const selector = `[data-ui-target="true"][data-ui-id="${CSS.escape(plateId)}"]`;
      const elements = Array.from(document.querySelectorAll(selector));
      if (!elements.length) continue;

      const rawPreset = allPresets?.[plateId] || {};
      const resolved = resolvePlatesFxPreset(rawPreset);
      const shouldApply = enabled && isDevtoolsEnabled() && resolved.enabled;
      for (const el of elements) {
        if (shouldApply) applyPlateStyles(el, resolved, rawPreset);
        else clearPlateStyles(el);
      }
    }

    appliedIdsRef.current = activeIds;
  }, [applyPlateStyles, clearPlateStyles, enabled, pickConfig?.selectedId]);

  useEffect(() => {
    const onPickUpdate = (event) => {
      const detail = event?.detail || null;
      if (!detail) {
        setPickConfig(readPickConfig());
        return;
      }
      setPickConfig({
        selectedId: typeof detail.selectedId === "string" && detail.selectedId.length ? detail.selectedId : null,
      });
    };

    window.addEventListener(PICK_EVENT, onPickUpdate);
    return () => window.removeEventListener(PICK_EVENT, onPickUpdate);
  }, []);

  useEffect(() => {
    return subscribePlatesFxPresets(() => applyAll());
  }, [applyAll]);

  useEffect(() => {
    applyAll();
  }, [applyAll, enabled, pickConfig.selectedId, stageBaseColor]);

  useEffect(() => {
    return () => {
      document.querySelectorAll(`.${SURFACE_CLASS}`).forEach((el) => clearPlateStyles(el));
      appliedIdsRef.current.clear();
    };
  }, [clearPlateStyles]);

  return null; // CSS-only, no DOM elements
}

export default SelectedPlateOverlay;
