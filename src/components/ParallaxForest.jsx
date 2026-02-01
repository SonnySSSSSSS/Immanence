import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// Parallax layer that loops seamlessly by rendering 2 copies side-by-side.
// We measure the rendered width of ONE image, then animate translating the track by that width.
function ParallaxLayer({
  src,
  secondsPerLoop,
  className = "",
  style = {},
  yTranslate = "0%", // e.g. "30%" to push down (clip bottom)
  heightPx = null,
  layerAnchor = "bottom",
  opacity = 1,
}) {
  const imgRef = useRef(null);
  const [loopW, setLoopW] = useState(0);

  const measure = () => {
    const el = imgRef.current;
    if (!el) return;
    let w = el.getBoundingClientRect().width;
    if (!w || w < 1) {
      const nw = el.naturalWidth || 0;
      const nh = el.naturalHeight || 0;
      const h = el.getBoundingClientRect().height || (typeof heightPx === "number" ? heightPx : 0);
      if (nw && nh && h) w = (nw / nh) * h;
      else if (nw) w = nw;
    }
    if (w) setLoopW((prev) => (Math.abs(w - prev) > 0.5 ? w : prev));
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, heightPx]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const t = setTimeout(measure, 150);

    const el = imgRef.current;
    const ro = el && typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && el) ro.observe(el);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightPx]);

  const animStyle = useMemo(() => {
    const duration = `${secondsPerLoop}s`;
    const heightStyle = heightPx ? { ["--pf-imgH"]: `${heightPx}px` } : {};
    return {
      ...style,
      ...heightStyle,
      opacity,
      ["--loopW"]: `${loopW}px`,
      ["--dur"]: duration,
    };
  }, [loopW, secondsPerLoop, style, opacity, heightPx]);

  return (
    <div
      className={`pf-layer ${className}`}
      style={{ ...animStyle, transform: `translateY(${yTranslate})` }}
      aria-hidden="true"
    >
      <div
        className="pf-track"
        style={{
          animationName: 'pfScroll',
          animationDuration: loopW > 0 ? `var(--dur)` : "0s",
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          top: layerAnchor === "top" ? 0 : "auto",
          bottom: layerAnchor === "top" ? "auto" : 0,
          alignItems: layerAnchor === "top" ? "flex-start" : "flex-end",
        }}
      >
        <img ref={imgRef} className="pf-img" src={src} alt="" draggable={false} onLoad={measure} />
        <img className="pf-img" src={src} alt="" draggable={false} onLoad={measure} />
      </div>
    </div>
  );
}

export default function ParallaxForest({
  skySrc = "/awareness/parallax_forest_00001_.png",
  treesSrc = "/awareness/parallax_forest_00002_.png",
  foliageSrc = "/awareness/parallax_forest_00003_.png",
  className = "",
  style = {},
}) {

  const rootRef = useRef(null);
  const [layerHeights, setLayerHeights] = useState({ sky: 0, trees: 0, foliage: 0 });

  const clamp = useCallback((value, min, max) => Math.max(min, Math.min(max, value)), []);

  const recomputeImgPx = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const sceneH = root.getBoundingClientRect().height;
    if (!sceneH) return;

    // Layer heights: sky fills full height and beyond, trees and foliage sized to their natural proportions
    const next = {
      sky: clamp(Math.round(sceneH * 1.6), 600, 1200),
      trees: clamp(Math.round(sceneH * 0.5), 260, 440),
      foliage: clamp(Math.round(sceneH * 0.25), 140, 220),
    };

    setLayerHeights((prev) => {
      const changed =
        Math.abs(prev.sky - next.sky) > 0.5 ||
        Math.abs(prev.trees - next.trees) > 0.5 ||
        Math.abs(prev.foliage - next.foliage) > 0.5;
      return changed ? next : prev;
    });
  }, [clamp]);

  useLayoutEffect(() => {
    // Two rAFs reduces "0px" reads during first paint on some devices.
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(recomputeImgPx);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [recomputeImgPx]);

  useEffect(() => {
    recomputeImgPx();
    const root = rootRef.current;
    if (!root) return;

    const ro = new ResizeObserver(recomputeImgPx);
    ro.observe(root);

    window.addEventListener("resize", recomputeImgPx);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recomputeImgPx);
    };
  }, [recomputeImgPx]);

  return (
    <div
      className={`pf-root ${className}`}
      style={{ ...style, ["--pf-imgH"]: "780px" }}
      ref={rootRef}
    >
      {/* Sky - anchored at very top of container, slowest */}
      <ParallaxLayer
        src={skySrc}
        secondsPerLoop={120}
        className="pf-sky"
        layerAnchor="top"
        heightPx={layerHeights.sky}
        yTranslate="0"
      />

      {/* Trees - sits above foliage, positioned for balance */}
      <ParallaxLayer
        src={treesSrc}
        secondsPerLoop={80}
        className="pf-trees"
        layerAnchor="bottom"
        heightPx={layerHeights.trees}
        yTranslate="-10%"
      />

      {/* Avatar (fixed in window, does not parallax-scroll). Must render BEFORE foliage so foliage overlays it. */}
      <div className="pf-avatar" aria-hidden="true">
        <img
          className="pf-avatarImg"
          src="/awareness/avatar/avatar_blocky_neutral.svg"
          alt=""
          draggable={false}
        />
      </div>

      {/* Foliage/grass - sits at very bottom, fastest */}
      <ParallaxLayer
        src={foliageSrc}
        secondsPerLoop={50}
        className="pf-foliage"
        layerAnchor="bottom"
        heightPx={layerHeights.foliage}
        yTranslate="0"
      />

      <style>{`
        .pf-root{
          --pf-imgH: 780px;
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .pf-layer{
          position: absolute;
          inset: 0;
          will-change: transform;
          overflow: hidden;
        }

        .pf-track{
          position: absolute;
          left: 0;
          top: auto;
          bottom: 0;
          height: 100%;
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          will-change: transform;
          animation: pfScroll var(--dur) linear infinite !important;
        }

        .pf-img{
          height: var(--pf-imgH) !important;
          width: auto !important;
          flex: 0 0 auto !important;

          /* defend against global resets */
          max-width: none !important;
          max-height: none !important;
          object-fit: none !important;

          user-select: none;
          pointer-events: none;
          display: block;
        }

        @keyframes pfScroll{
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(calc(-1 * var(--loopW)), 0, 0); }
        }

        .pf-sky{ z-index: 0; }
        .pf-trees{ z-index: 1; }
        .pf-avatar{ z-index: 2; }
        .pf-foliage{ z-index: 3; }

        .pf-avatar{
          position: absolute;
          left: 22%;
          bottom: calc(6% + 30px);
          transform: translateX(-50%);
          pointer-events: none;
          will-change: transform;
          animation: pfBob 4.5s ease-in-out infinite;
        }

        .pf-avatarImg{
          height: clamp(92px, 14vh, 140px);
          width: auto;
          user-select: none;
          pointer-events: none;
        }

        @keyframes pfBob{
          0%   { transform: translateX(-50%) translateY(0); }
          50%  { transform: translateX(-50%) translateY(-10px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
