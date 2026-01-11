export default function BreathWaveform() {
  return (
    <svg viewBox="-20 -20 470 104" style={{ width: "100%", height: "64px", display: "block" }}>
      <defs>
        <filter id="g" x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="M10 46 L40 18 L92 18 L120 46 L160 46 L190 18 L242 18 L270 46 L310 46 L340 18 L392 18 L420 46"
        fill="none"
        stroke="#E9C35A"
        strokeOpacity="0.18"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#g)"
      />

      <path
        d="M10 46 L40 18 L92 18 L120 46 L160 46 L190 18 L242 18 L270 46 L310 46 L340 18 L392 18 L420 46"
        fill="none"
        stroke="#E9C35A"
        strokeOpacity="0.45"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#g)"
      />

      <path
        d="M10 46 L40 18 L92 18 L120 46 L160 46 L190 18 L242 18 L270 46 L310 46 L340 18 L392 18 L420 46"
        fill="none"
        stroke="#E9C35A"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
