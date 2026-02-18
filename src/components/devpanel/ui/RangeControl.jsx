function RangeControl({ label, value, min, max, step, onChange, disabled = false, suffix = '' }) {
  const displayValue = Number(step) < 1 ? Number(value).toFixed(2) : String(Math.round(value));
  return (
    <label className={`block text-[11px] ${disabled ? 'opacity-45' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-white/85">{displayValue}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400 disabled:cursor-not-allowed"
      />
    </label>
  );
}

export default RangeControl;
