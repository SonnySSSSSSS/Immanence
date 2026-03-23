function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeProgress(value, min, max) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || min === max) return 0;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized)) * 100;
}

function RangeControl({ label, value, min, max, step, onChange, disabled = false, suffix = '' }) {
  const numericMin = Number.isFinite(Number(min)) ? Number(min) : 0;
  const numericMax = Number.isFinite(Number(max)) ? Number(max) : 100;
  const rawValue = Number.isFinite(Number(value)) ? Number(value) : numericMin;
  const clampedValue = clampValue(rawValue, numericMin, numericMax);
  const progress = computeProgress(clampedValue, numericMin, numericMax);
  const displayValue = Number(step) < 1 ? Number(clampedValue).toFixed(2) : String(Math.round(clampedValue));

  return (
    <label className={`block text-[11px] ${disabled ? 'opacity-45' : ''}`}>
      <style>{`
        .dev-range-control-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: linear-gradient(
            90deg,
            rgba(245, 158, 11, 0.75) 0%,
            rgba(251, 191, 36, 0.85) var(--dev-range-progress, 0%),
            rgba(255, 255, 255, 0.12) var(--dev-range-progress, 0%),
            rgba(255, 255, 255, 0.08) 100%
          );
          box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.35);
          cursor: pointer;
        }
        .dev-range-control-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.88);
          background: radial-gradient(circle at 30% 30%, #fff6dd 0%, #fbbf24 42%, #f59e0b 100%);
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.28), 0 2px 8px rgba(0, 0, 0, 0.45);
          margin-top: -5px;
        }
        .dev-range-control-input::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.88);
          background: radial-gradient(circle at 30% 30%, #fff6dd 0%, #fbbf24 42%, #f59e0b 100%);
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.28), 0 2px 8px rgba(0, 0, 0, 0.45);
        }
        .dev-range-control-input::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.1);
        }
        .dev-range-control-input:disabled {
          cursor: not-allowed;
        }
      `}</style>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-white/85">{displayValue}{suffix}</span>
      </div>
      <input
        type="range"
        min={numericMin}
        max={numericMax}
        step={step}
        value={clampedValue}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="dev-range-control-input disabled:cursor-not-allowed"
        style={{ '--dev-range-progress': `${progress}%` }}
      />
    </label>
  );
}

export default RangeControl;
