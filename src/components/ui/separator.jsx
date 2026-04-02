import React from "react";

export function Separator({ orientation = "horizontal" }) {
  if (orientation === "vertical") {
    return <span className="h-4 w-px bg-white/20" aria-hidden="true" />;
  }
  return <hr className="my-2 h-px border-0 bg-white/20" />;
}
