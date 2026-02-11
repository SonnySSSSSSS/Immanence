import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useSettingsStore } from "../../state/settingsStore.js";
import { ElectricBorder } from "./ElectricBorder.jsx";

const TARGET_SELECTOR = '[data-ui="practice-button"]';
const BORDER_OFFSET_PX = 14; // Button-sized: 14–18 recommended
const PICK_STORAGE_KEY = "immanence.dev.practiceButtonFxPicker";
const PICK_EVENT = "immanence-practice-button-fx-picker";

const PRESET_COLORS = {
  breath: "rgba(52, 211, 153, 1)", // emerald / cyan-green
  stillness: "rgba(255, 210, 120, 1)", // warm gold
  awareness: "rgba(105, 235, 255, 1)", // electric cyan (lean blue)
  visual: "rgba(196, 120, 255, 1)", // magenta-violet
  sound: "rgba(108, 126, 255, 1)", // deep cobalt / indigo
  integration: "rgba(251, 191, 36, 1)",
  circuit: "rgba(168, 85, 247, 1)",
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

function normalizePracticeType(raw) {
  const t = String(raw || "").trim().toLowerCase();
  if (!t) return null;
  if (t === "perception") return "visual";
  if (t === "resonance") return "sound";
  return t;
}

function readPickConfig() {
  if (typeof window === "undefined") {
    return { applyToAll: true, selectedKey: null };
  }

  try {
    const raw = window.localStorage.getItem(PICK_STORAGE_KEY);
    if (!raw) return { applyToAll: true, selectedKey: null };
    const parsed = JSON.parse(raw);
    return {
      applyToAll: parsed?.applyToAll !== false,
      selectedKey: typeof parsed?.selectedKey === "string" && parsed.selectedKey.length ? parsed.selectedKey : null,
    };
  } catch {
    return { applyToAll: true, selectedKey: null };
  }
}

function toOverlayModel(el) {
  if (!(el instanceof Element)) return null;
  const rect = el.getBoundingClientRect();
  if (!rect || rect.width < 2 || rect.height < 2) return null;

  const radius = readTargetRadiusPx(el);
  const practiceType = normalizePracticeType(el.getAttribute("data-practice-type"));
  const color = PRESET_COLORS[practiceType] || PRESET_COLORS.awareness;
  const id = el.getAttribute("data-practice-id") || el.id || practiceType || "practice";

  return {
    key: `${practiceType || "practice"}:${id}`,
    color,
    rect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    },
    radius,
  };
}

export function PracticeButtonElectricBorderOverlay() {
  const enabled = useSettingsStore((s) => Boolean(s.practiceButtonFxEnabled));
  const reduceMotionSetting = useSettingsStore((s) => Boolean(s.reduceMotion));
  const [pickConfig, setPickConfig] = useState(() => readPickConfig());

  const [targets, setTargets] = useState([]);
  const roRef = useRef(null);
  const moRef = useRef(null);
  const rafPendingRef = useRef(false);

  const scheduleScan = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    window.requestAnimationFrame(() => {
      rafPendingRef.current = false;
      if (!enabled) {
        setTargets([]);
        return;
      }
      const els = Array.from(document.querySelectorAll(TARGET_SELECTOR));
      const models = els.map(toOverlayModel).filter(Boolean);
      const filtered = (!pickConfig.applyToAll && pickConfig.selectedKey)
        ? models.filter((m) => m.key === pickConfig.selectedKey)
        : models;
      setTargets(filtered);

      // Keep ResizeObserver in sync with the current target set.
      if (roRef.current) {
        roRef.current.disconnect();
        els.forEach((el) => roRef.current?.observe(el));
      }
    });
  }, [enabled, pickConfig.applyToAll, pickConfig.selectedKey]);

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
        applyToAll: detail.applyToAll !== false,
        selectedKey: typeof detail.selectedKey === "string" && detail.selectedKey.length ? detail.selectedKey : null,
      });
      scheduleScan();
    };

    window.addEventListener(PICK_EVENT, onPickUpdate);
    return () => window.removeEventListener(PICK_EVENT, onPickUpdate);
  }, [scheduleScan]);

  useEffect(() => {
    roRef.current?.disconnect();
    roRef.current = null;
    moRef.current?.disconnect();
    moRef.current = null;

    if (!enabled) {
      setTargets([]);
      return undefined;
    }

    scheduleScan();

    roRef.current = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scheduleScan()) : null;
    document.querySelectorAll(TARGET_SELECTOR).forEach((el) => roRef.current?.observe(el));

    moRef.current = typeof MutationObserver !== "undefined" ? new MutationObserver(() => scheduleScan()) : null;
    moRef.current?.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-ui", "data-practice-type", "data-practice-id"],
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
  }, [enabled, scheduleScan]);

  const overlays = useMemo(() => {
    if (!enabled) return [];

    const speed = reduceMotionSetting ? 0 : 0.045;
    const chaos = 0.06;

    return targets.map((t) => {
      const r = t.rect;
      return {
        key: t.key,
        style: {
          position: "fixed",
          left: `${r.left - BORDER_OFFSET_PX}px`,
          top: `${r.top - BORDER_OFFSET_PX}px`,
          width: `${r.width + BORDER_OFFSET_PX * 2}px`,
          height: `${r.height + BORDER_OFFSET_PX * 2}px`,
          pointerEvents: "none",
          zIndex: 9997,
        },
        width: r.width + BORDER_OFFSET_PX * 2,
        height: r.height + BORDER_OFFSET_PX * 2,
        innerRect: {
          x: BORDER_OFFSET_PX,
          y: BORDER_OFFSET_PX,
          width: r.width,
          height: r.height,
          radius: t.radius,
        },
        color: t.color,
        speed,
        chaos,
      };
    });
  }, [enabled, reduceMotionSetting, targets]);

  if (!enabled || overlays.length === 0) return null;

  return createPortal(
    <>
      {overlays.map((o) => (
        <div key={o.key} data-dev-overlay="practice-button-electric-border" style={o.style}>
          <ElectricBorder
            width={o.width}
            height={o.height}
            innerRect={o.innerRect}
            color={o.color}
            speed={o.speed}
            chaos={o.chaos}
            thickness={1.8}
            showSparks={false}
          />
        </div>
      ))}
    </>,
    document.body
  );
}

export default PracticeButtonElectricBorderOverlay;
