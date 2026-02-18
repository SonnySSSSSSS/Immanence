function DestructiveButton({ label, armed, onArm }) {
  return (
    <button
      onClick={onArm}
      className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-all ${armed
        ? 'bg-red-500/30 border-2 border-red-500 text-red-300 animate-pulse'
        : 'bg-red-500/10 border border-red-500/30 text-red-400/70 hover:bg-red-500/20'
        }`}
    >
      {armed ? `⚠️ CONFIRM: ${label}?` : label}
    </button>
  );
}

export default DestructiveButton;
