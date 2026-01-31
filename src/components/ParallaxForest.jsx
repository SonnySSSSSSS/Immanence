import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

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
    if (w && Math.abs(w - loopW) > 0.5) setLoopW(w);
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const t = setTimeout(measure, 150);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
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
  return (
    <div className={`pf-root ${className}`} style={style}>
      {/* Slowest (exact 60s requirement) */}
      <ParallaxLayer src={skySrc} secondsPerLoop={60} className="pf-sky" />

      {/* Medium */}
      <ParallaxLayer src={treesSrc} secondsPerLoop={40} className="pf-trees" />

      {/* Fastest + pushed down so bottom clips */}
      <ParallaxLayer
        src={foliageSrc}
        secondsPerLoop={25}
        className="pf-foliage"
        yTranslate="30%"
      />

      <style>{`
        .pf-root{
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
          top: 0;
          height: 100%;
          display: flex;
          flex-direction: row;
          align-items: stretch;
          animation-name: pfScroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        /* Each image fills the scene height; width auto scales => we measure rendered width */
        .pf-img{
          height: 100%;
          width: auto;
          flex: 0 0 auto;
          image-rendering: auto;
          user-select: none;
          pointer-events: none;
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
