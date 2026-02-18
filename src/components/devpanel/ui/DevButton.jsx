function DevButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-white/70 hover:text-white/90 transition-all"
    >
      {children}
    </button>
  );
}

export default DevButton;
