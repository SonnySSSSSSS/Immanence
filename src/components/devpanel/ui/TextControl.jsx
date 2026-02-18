function TextControl({ label, value, onChange, disabled = false, placeholder = '', mono = true }) {
  return (
    <label className={`block text-[11px] ${disabled ? 'opacity-45' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/70">{label}</span>
      </div>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(String(e.target.value))}
        className={`w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white/90 ${mono ? 'font-mono' : ''}`}
      />
    </label>
  );
}

export default TextControl;
