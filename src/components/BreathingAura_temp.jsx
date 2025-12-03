//
// ─── BREATHING AURA (for Practice mode) ────────────────────────────────────────
//
function BreathingAura({ breathPattern }) {
    const {
        inhale = 4,
        holdTop = 4,
        exhale = 4,
        holdBottom = 2,
    } = breathPattern || {};

    const total = inhale + holdTop + exhale + holdBottom;
    const minScale = 0.75;
    const maxScale = 1.15;

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!total || total <= 0) return;

        const cycleMs = total * 1000;
        const start = performance.now();
        let frameId = null;

        const loop = (now) => {
            const elapsed = now - start;
            const t = (elapsed % cycleMs) / cycleMs;
            setProgress(t);
            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [total]);

    if (!total) return null;

    const tInhale = inhale / total;
    const tHoldTop = (inhale + holdTop) / total;
    const tExhale = (inh + holdTop + exhale) / total;

    let scale = minScale;
    if (progress < tInhale) {
        scale = minScale + (maxScale - minScale) * (progress / tInhale);
    } else if (progress < tHoldTop) {
        scale = maxScale;
    } else if (progress < tExhale) {
        scale =
            maxScale -
            (maxScale - minScale) * ((progress - tHoldTop) / (tExhale - tHoldTop));
    } else {
        scale = minScale;
    }

    // Read accent color from CSS variables set by ThemeProvider
    const rootStyles = getComputedStyle(document.documentElement);
    const accentH = rootStyles.getPropertyValue('--accent-h').trim() || '42';
    const accentS = rootStyles.getPropertyValue('--accent-s').trim().replace('%', '') || '95';
    const accentL = rootStyles.getPropertyValue('--accent-l').trim().replace('%', '') || '58';

    // Parse to numbers
    const sNum = parseInt(accentS);
    const lNum = parseInt(accentL);

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Main breathing glow - uses stage color from CSS variables */}
            <div
                className="rounded-full"
                style={{
                    width: "80%",
                    height: "80%",
                    background:
                        `radial-gradient(circle, hsla(${accentH}, ${sNum}%, ${lNum + 15}%, 0.95) 0%, hsla(${accentH}, ${sNum - 5}%, ${lNum}%, 0.45) 32%, rgba(248,250,252,0.02) 75%, transparent 100%)`,
                    filter: "blur(6px)",
                    transform: `scale(${scale})`,
                    transition: "transform 80ms linear, background 2s ease",
                    mixBlendMode: "screen",
                }}
            />

            {/* Gold accent trace for 3D depth */}
            <div
                className="rounded-full absolute"
                style={{
                    width: "80%",
                    height: "80%",
                    background:
                        `radial-gradient(circle at 30% 30%, rgba(252, 211, 77, 0.3) 0%, transparent 40%)`,
                    filter: "blur(8px)",
                    transform: `scale(${scale})`,
                    transition: "transform 80ms linear",
                    mixBlendMode: "screen",
                }}
            />
        </div>
    );
}
