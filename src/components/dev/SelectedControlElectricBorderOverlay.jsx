import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { isDevtoolsEnabled } from "../../dev/uiDevtoolsGate.js";
import { resolveFxSurface } from "../../dev/uiTargetContract.js";
import { getControlsFxPreset, subscribeControlsFxPresets } from "../../dev/controlsFxPresets.js";
import { useSettingsStore } from "../../state/settingsStore.js";
import { ElectricBorder } from "./ElectricBorder.jsx";

const PICK_STORAGE_KEY = "immanence.dev.controlsFxPicker";
const PICK_EVENT = "immanence-controls-fx-picker";
const SURFACE_CLASS = "dev-controls-fx-surface";

const ROLE_GROUP_COLORS = {
  homeHub: "rgba(255, 210, 120, 1)", // warm gold
  practice: "rgba(105, 235, 255, 1)", // electric cyan
  dailyPractice: "rgba(52, 211, 153, 1)", // emerald
};

function parsePx(value) {
  if (typeof value !== "string") return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function readTargetRadiusPx(targetEl) {
  if (!(targetEl instanceof Element)) return 0;
  const cs = window.getComputedStyle(targetEl);
  return parsePx(cs.borderTopLeftRadius || cs.borderRadius || "0");
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

function toOverlayModel(rootEl, preset) {
  if (!(rootEl instanceof Element)) return null;
  const surfaceRes = resolveFxSurface(rootEl);
  if (!surfaceRes.ok || !(surfaceRes.surfaceEl instanceof Element)) return null;

  const rect = surfaceRes.surfaceEl.getBoundingClientRect();
  if (!rect || rect.width < 2 || rect.height < 2) return null;

  const roleGroup = rootEl.getAttribute("data-ui-role-group") || "unknown";
  const color = (preset?.color && String(preset.color).trim().length)
    ? preset.color
    : (ROLE_GROUP_COLORS[roleGroup] || ROLE_GROUP_COLORS.practice);
  const id = rootEl.getAttribute("data-ui-id") || "control";

  return {
    key: `${id}@${roleGroup}`,
    color,
    rect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    },
    radius: readTargetRadiusPx(surfaceRes.surfaceEl),
    preset: preset || null,
  };
}

export function SelectedControlElectricBorderOverlay() {
  const enabled = useSettingsStore((s) => Boolean(s.controlsElectricBorderEnabled));
  const reduceMotionSetting = useSettingsStore((s) => Boolean(s.reduceMotion));
  const [pickConfig, setPickConfig] = useState(() => readPickConfig());
  const [preset, setPreset] = useState(() => getControlsFxPreset(pickConfig.selectedId));

  const [targets, setTargets] = useState([]);
  const roRef = useRef(null);
  const moRef = useRef(null);
  const rafPendingRef = useRef(false);

  const scheduleScan = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    window.requestAnimationFrame(() => {
      rafPendingRef.current = false;
      if (!enabled || !isDevtoolsEnabled() || !pickConfig.selectedId) {
        setTargets([]);
        return;
      }

      const nextPreset = getControlsFxPreset(pickConfig.selectedId);
      setPreset(nextPreset);

      const selector = `[data-ui-target="true"][data-ui-id="${CSS.escape(pickConfig.selectedId)}"]`;
      const roots = Array.from(document.querySelectorAll(selector));
      const models = roots.map((el) => toOverlayModel(el, nextPreset)).filter(Boolean);
      setTargets(models);

      if (roRef.current) {
        roRef.current.disconnect();
        roots.forEach((el) => roRef.current?.observe(el));
      }
    });
  }, [enabled, pickConfig.selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onPickUpdate = (event) => {
      const detail = event?.detail || null;
      if (!detail) {
        setPickConfig(readPickConfig());
        scheduleScan();
        return;
      }
      setPickConfig({
        selectedId: typeof detail.selectedId === "string" && detail.selectedId.length ? detail.selectedId : null,
      });
      scheduleScan();
    };

    window.addEventListener(PICK_EVENT, onPickUpdate);
    return () => window.removeEventListener(PICK_EVENT, onPickUpdate);
  }, [scheduleScan]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    return subscribeControlsFxPresets(() => scheduleScan());
  }, [scheduleScan]);

  useEffect(() => {
    roRef.current?.disconnect();
    roRef.current = null;
    moRef.current?.disconnect();
    moRef.current = null;

    if (!enabled || !isDevtoolsEnabled() || !pickConfig.selectedId) {
      setTargets([]);
      return undefined;
    }

    scheduleScan();

    roRef.current = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scheduleScan()) : null;
    const selector = `[data-ui-target="true"][data-ui-id="${CSS.escape(pickConfig.selectedId)}"]`;
    document.querySelectorAll(selector).forEach((el) => roRef.current?.observe(el));

    moRef.current = typeof MutationObserver !== "undefined" ? new MutationObserver(() => scheduleScan()) : null;
    moRef.current?.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-ui-target", "data-ui-id", "data-ui-role-group", "data-ui-fx-surface"],
    });

    const onScroll = () => scheduleScan();
    const onResize = () => scheduleScan();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      roRef.current?.disconnect();
      roRef.current = null;
      moRef.current?.disconnect();
      moRef.current = null;
    };
  }, [enabled, pickConfig.selectedId, scheduleScan]);

  const overlays = useMemo(() => {
    if (!enabled || !isDevtoolsEnabled()) return [];

    const effectiveSpeed = reduceMotionSetting ? 0 : (preset?.speed ?? 0.052);
    const effectiveChaos = preset?.chaos ?? 0.095;
    const thickness = preset?.thickness ?? 2;
    const offsetPx = preset?.offsetPx ?? 16;

    return targets.map((t) => {
      const r = t.rect;
      return {
        key: t.key,
        style: {
          position: "fixed",
          left: `${r.left - offsetPx}px`,
          top: `${r.top - offsetPx}px`,
          width: `${r.width + offsetPx * 2}px`,
          height: `${r.height + offsetPx * 2}px`,
          pointerEvents: "none",
          zIndex: 9997,
        },
        width: r.width + offsetPx * 2,
        height: r.height + offsetPx * 2,
        innerRect: {
          x: offsetPx,
          y: offsetPx,
          width: r.width,
          height: r.height,
          radius: t.radius,
        },
        color: t.color,
        speed: effectiveSpeed,
        chaos: effectiveChaos,
        thickness,
      };
    });
  }, [enabled, reduceMotionSetting, preset, targets]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const styled = new Set();

    if (enabled && isDevtoolsEnabled() && pickConfig.selectedId) {
      const selector = `[data-ui-target="true"][data-ui-id="${CSS.escape(pickConfig.selectedId)}"]`;
      const roots = Array.from(document.querySelectorAll(selector));
      for (const root of roots) {
        const surfaceRes = resolveFxSurface(root);
        const surface = surfaceRes.ok && surfaceRes.surfaceEl instanceof Element ? surfaceRes.surfaceEl : null;
        if (!surface) continue;
        styled.add(surface);

        const color = (preset?.color && String(preset.color).trim().length)
          ? preset.color
          : (ROLE_GROUP_COLORS[root.getAttribute("data-ui-role-group") || "unknown"] || ROLE_GROUP_COLORS.practice);

        surface.classList.add(SURFACE_CLASS);
        surface.style.setProperty("--dev-controls-fx-glow", `${Number(preset?.glow ?? 18)}px`);
        surface.style.setProperty("--dev-controls-fx-blur", `${Number(preset?.blur ?? 6)}px`);
        surface.style.setProperty("--dev-controls-fx-opacity", `${Number(preset?.opacity ?? 1)}`);
        surface.style.setProperty("--dev-controls-fx-color", color);
      }
    }

    return () => {
      styled.forEach((surface) => {
        surface.classList.remove(SURFACE_CLASS);
        surface.style.removeProperty("--dev-controls-fx-glow");
        surface.style.removeProperty("--dev-controls-fx-blur");
        surface.style.removeProperty("--dev-controls-fx-opacity");
        surface.style.removeProperty("--dev-controls-fx-color");
      });
    };
  }, [enabled, pickConfig.selectedId, preset]);

  if (!enabled || !isDevtoolsEnabled() || overlays.length === 0) return null;

  return createPortal(
    <>
      {overlays.map((o) => (
        <div key={o.key} data-dev-overlay="selected-control-electric-border" style={o.style}>
          <ElectricBorder
            width={o.width}
            height={o.height}
            innerRect={o.innerRect}
            color={o.color}
            speed={o.speed}
            chaos={o.chaos}
            thickness={o.thickness}
            showSparks={false}
          />
        </div>
      ))}
    </>,
    document.body
  );
}

export default SelectedControlElectricBorderOverlay;
