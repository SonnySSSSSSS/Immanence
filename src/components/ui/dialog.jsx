import React, { useEffect, useRef } from "react";

export function Dialog({
  open = false,
  onOpenChange,
  title,
  description,
  children,
  closeOnOutsideClick = true,
  autoDismissTimeout = null,
}) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!open || !autoDismissTimeout) return;
    timeoutRef.current = window.setTimeout(() => {
      onOpenChange(false);
    }, autoDismissTimeout);
    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [open, autoDismissTimeout, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (!closeOnOutsideClick) return;
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900/90 p-4 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {description && <p className="text-xs text-white/70">{description}</p>}
          </div>
          <button
            className="text-white/80 hover:text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm text-white/85">{children}</div>
      </div>
    </div>
  );
}

