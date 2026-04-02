import React from "react";

export function Button({ variant = "ghost", className = "", children, ...props }) {
  const base = "inline-flex items-center justify-center rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";
  const styleByVariant = {
    ghost: "bg-white/8 text-white hover:bg-white/12",
    subtle: "bg-white/12 text-white hover:bg-white/20",
    solid: "bg-sky-600 text-white hover:bg-sky-500",
  };
  return (
    <button className={`${base} ${styleByVariant[variant] || styleByVariant.ghost} ${className}`} {...props}>
      {children}
    </button>
  );
}
