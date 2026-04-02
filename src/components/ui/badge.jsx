import React from "react";

export function Badge({ variant = "default", className = "", children }) {
  const classes = {
    default: "rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white",
    subtle: "rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white/90",
  };
  return <span className={`${classes[variant] || classes.default} ${className}`}>{children}</span>;
}
