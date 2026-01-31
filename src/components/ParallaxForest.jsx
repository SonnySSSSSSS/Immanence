import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// Parallax layer that loops seamlessly by rendering 2 copies side-by-side.
// We measure the rendered width of ONE image, then animate translating the track by that width.
function ParallaxLayer({
  src,
  secondsPerLoop,
  className = "",
  style = {},
  yTranslate = "0%", // e.g. "30%" to push down (clip bottom)
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
    return {
      ...style,
      opacity,
      ["--loopW"]: `${loopW}px`,
      ["--dur"]: duration,
    };
  }, [loopW, secondsPerLoop, style, opacity]);

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
  const [imgPx, setImgPx] = useState(0);

  const recomputeImgPx = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const sceneH = root.getBoundingClientRect().height;
    if (!sceneH) return;

    const px = Math.max(720, Math.min(900, Math.round(sceneH * 1.3)));
    setImgPx((prev) => (Math.abs(prev - px) > 0.5 ? px : prev));
  }, []);

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
      style={{ ...style, ["--pf-imgH"]: imgPx ? `${imgPx}px` : "780px" }}
      ref={rootRef}
    >
      {/* Slowest (exact 60s requirement) */}
      <ParallaxLayer src={skySrc} secondsPerLoop={60} className="pf-sky" />

      {/* Medium */}
      <ParallaxLayer src={treesSrc} secondsPerLoop={40} className="pf-trees" />

      {/* Fastest + pushed down so bottom clips */}
      <ParallaxLayer
        src={foliageSrc}
        secondsPerLoop={25}
        className="pf-foliage"
        yTranslate="140px"
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
