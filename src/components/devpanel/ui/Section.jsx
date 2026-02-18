function Section({ title, expanded, onToggle, children, isLight = false }) {
  return (
    <div className="border rounded-xl overflow-hidden" style={{
      background: isLight ? 'rgba(180, 155, 110, 0.08)' : 'rgba(255, 255, 255, 0.03)',
      borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
    }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium" style={{
          color: isLight ? 'rgba(45, 40, 35, 0.85)' : 'rgba(255, 255, 255, 0.8)'
        }}>{title}</span>
        <span style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}

export default Section;
