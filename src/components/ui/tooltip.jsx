import React from "react";

export function Tooltip({ content, children }) {
  return (
    <span className="group relative inline-block">
      {children}
      <span className="pointer-events-none absolute bottom-full mb-2 hidden w-max rounded bg-black/80 px-2 py-1 text-[10px] text-white group-hover:block group-focus:block">
        {content}
      </span>
    </span>
  );
}
