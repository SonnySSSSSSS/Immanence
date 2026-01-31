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
    const w = el.getBoundingClientRect().width;
    if (w) setLoopW((prev) => (Math.abs(w - prev) > 0.5 ? w : prev));
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

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
          animationDuration: loopW > 0 ? `var(--dur)` : "0s",
          top: layerAnchor === "top" ? 0 : "auto",
          bottom: layerAnchor === "top" ? "auto" : 0,
          alignItems: layerAnchor === "top" ? "flex-start" : "flex-end",
        }}
      >
        <img ref={imgRef} className="pf-img" src={src} alt="" draggable={false} onLoad={measure} />
        <img className="pf-img" src={src} alt="" draggable={false} />
      </div>
    </div>
  );
}

export default function ParallaxForest({
  skySrc = "/visualization/awareness/parallax_forest_00001_.png",
  treesSrc = "/visualization/awareness/parallax_forest_00002_.png",
  foliageSrc = "/visualization/awareness/parallax_forest_00003_.png",
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

    const next = {
      sky: clamp(Math.round(sceneH * 1.05), 520, 740),
      trees: clamp(Math.round(sceneH * 0.6), 300, 430),
      foliage: clamp(Math.round(sceneH * 0.34), 180, 260),
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
      {/* Slowest - sky backdrop behind everything */}
      <ParallaxLayer
        src={skySrc}
        secondsPerLoop={60}
        className="pf-sky"
        layerAnchor="top"
        heightPx={layerHeights.sky}
        yTranslate="0px"
      />

      {/* Medium - trees in middle, top overlaps sky, bottom overlapped by foliage */}
      <ParallaxLayer
        src={treesSrc}
        secondsPerLoop={40}
        className="pf-trees"
        layerAnchor="bottom"
        heightPx={layerHeights.trees}
        yTranslate="18%"
      />

      {/* Fastest - foliage at front, overlaps bottom of trees */}
      <ParallaxLayer
        src={foliageSrc}
        secondsPerLoop={25}
        className="pf-foliage"
        layerAnchor="bottom"
        heightPx={layerHeights.foliage}
        yTranslate="8%"
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
          animation-name: pfScroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
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

        /* Optional: minor depth tinting if you want */
        .pf-sky{ opacity: 1; }
        .pf-trees{ opacity: 1; }
        .pf-foliage{ opacity: 1; }
      `}</style>
    </div>
  );
}
