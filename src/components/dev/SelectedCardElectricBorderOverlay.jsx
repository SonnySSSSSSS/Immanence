import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { subscribeCardTuner } from "../../dev/cardTuner.js";
import { useSettingsStore } from "../../state/settingsStore.js";
import { ElectricBorder } from "./ElectricBorder.jsx";

const BORDER_OFFSET_PX = 22; // Card-sized: 16–28 recommended
const TARGET_SELECTOR = '[data-card="true"]';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cssEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
}

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

function resolveSelectedCardEl({ selectedCardId, selectedCardCarouselId }) {
  if (typeof document === "undefined") return { targetEl: null, carouselRoot: null };

  const selectedEl = selectedCardId
    ? document.querySelector(`${TARGET_SELECTOR}[data-card-id="${cssEscape(selectedCardId)}"]`)
    : null;

  const carouselRoot =
    (selectedCardCarouselId
      ? document.querySelector(`[data-card-carousel-root="${cssEscape(selectedCardCarouselId)}"]`)
      : null) || selectedEl?.closest?.("[data-card-carousel-root]") || null;

  if (carouselRoot) {
    const activeEl =
      carouselRoot.querySelector(`${TARGET_SELECTOR}[data-card-active="true"]`) ||
      carouselRoot.querySelector(`[data-card-active="true"]`);
    if (activeEl instanceof Element) return { targetEl: activeEl, carouselRoot };
  }

  return { targetEl: selectedEl instanceof Element ? selectedEl : null, carouselRoot };
}

export function SelectedCardElectricBorderOverlay() {
  const enabled = useSettingsStore((s) => Boolean(s.cardElectricBorderEnabled));
  const reduceMotionSetting = useSettingsStore((s) => Boolean(s.reduceMotion));

  const [snapshot, setSnapshot] = useState(null);
  const [model, setModel] = useState(null);

  const roRef = useRef(null);
  const moRef = useRef(null);
  const warnOnceRef = useRef(false);
  const rafPendingRef = useRef(false);

  const scheduleMeasure = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    window.requestAnimationFrame(() => {
      rafPendingRef.current = false;
      if (!enabled) {
        setModel(null);
        return;
      }

      const selectedCardId = snapshot?.selectedCardId || null;
      const selectedCardCarouselId = snapshot?.selectedCardCarouselId || null;
      if (!selectedCardId && !selectedCardCarouselId) {
        setModel(null);
        return;
      }

      const { targetEl, carouselRoot } = resolveSelectedCardEl({ selectedCardId, selectedCardCarouselId });
      if (!(targetEl instanceof Element)) {
        setModel(null);
        if (import.meta.env.DEV && !warnOnceRef.current) {
          warnOnceRef.current = true;
          // eslint-disable-next-line no-console
          console.warn("[SelectedCardElectricBorderOverlay] No selected card element found for:", {
            selectedCardId,
            selectedCardCarouselId,
          });
        }
        return;
      }
      warnOnceRef.current = false;

      const rect = targetEl.getBoundingClientRect();
      if (!rect || rect.width < 2 || rect.height < 2) {
        setModel(null);
        return;
      }

      const radius = readTargetRadiusPx(targetEl);

      const left = rect.left - BORDER_OFFSET_PX;
      const top = rect.top - BORDER_OFFSET_PX;
      const width = rect.width + BORDER_OFFSET_PX * 2;
      const height = rect.height + BORDER_OFFSET_PX * 2;

      setModel({
        style: {
          position: "fixed",
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: "none",
          zIndex: 9997,
        },
        width,
        height,
        innerRect: {
          x: BORDER_OFFSET_PX,
          y: BORDER_OFFSET_PX,
          width: rect.width,
          height: rect.height,
          radius,
        },
        // keep params stable; DevPanel tuning can come later
        color: "rgba(255, 210, 120, 1)",
        speed: reduceMotionSetting ? 0 : 0.06,
        chaos: 0.14,
        carouselRoot,
        targetEl,
      });

      // Keep ResizeObserver in sync.
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current.observe(targetEl);
      }

      // Keep MutationObserver in sync (carousel active flips are attribute-only).
      if (moRef.current) {
        moRef.current.disconnect();
        if (carouselRoot instanceof Element) {
          moRef.current.observe(carouselRoot, {
            subtree: true,
            attributes: true,
            attributeFilter: ["data-card-active"],
          });
        }
      }
    });
  }, [enabled, reduceMotionSetting, snapshot]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const un = subscribeCardTuner((next) => setSnapshot(next));
    return () => un();
  }, []);

  useEffect(() => {
    roRef.current?.disconnect();
    roRef.current = null;
    moRef.current?.disconnect();
    moRef.current = null;

    if (!enabled) {
      setModel(null);
      return undefined;
    }

    scheduleMeasure();

    roRef.current = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scheduleMeasure()) : null;
    moRef.current = typeof MutationObserver !== "undefined" ? new MutationObserver(() => scheduleMeasure()) : null;

    const onScroll = () => scheduleMeasure();
    const onResize = () => scheduleMeasure();
    const onCarousel = () => scheduleMeasure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("dev:card-carousel-change", onCarousel);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("dev:card-carousel-change", onCarousel);
      roRef.current?.disconnect();
      roRef.current = null;
      moRef.current?.disconnect();
      moRef.current = null;
    };
  }, [enabled, scheduleMeasure]);

  const overlay = useMemo(() => {
    if (!enabled || !model) return null;
    const w = Math.max(1, Math.round(model.width));
    const h = Math.max(1, Math.round(model.height));
    const innerRect = model.innerRect;
    const radius = clamp(Number(innerRect?.radius) || 0, 0, Math.min(innerRect.width, innerRect.height) / 2);
    return {
      style: model.style,
      width: w,
      height: h,
      innerRect: { ...innerRect, radius },
      color: model.color,
      speed: model.speed,
      chaos: model.chaos,
    };
  }, [enabled, model]);

  if (!enabled || !overlay) return null;

  return createPortal(
    <div data-dev-overlay="selected-card-electric-border" style={overlay.style}>
      <ElectricBorder
        width={overlay.width}
        height={overlay.height}
        innerRect={overlay.innerRect}
        color={overlay.color}
        speed={overlay.speed}
        chaos={overlay.chaos}
        thickness={2.2}
        showSparks={false}
        clipToOutside
      />
    </div>,
    document.body
  );
}

export default SelectedCardElectricBorderOverlay;

