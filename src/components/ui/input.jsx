import React from "react";

export function Input(props) {
  return (
    <input
      className="w-full rounded-md border border-white/20 bg-slate-800 px-2 py-1 text-sm text-white outline-none focus:border-sky-400"
      {...props}
    />
  );
}
