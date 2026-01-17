import React from "react";

function PracticeSectionShell({ children, className, style }) {
  return (
    <section className={className} style={style}>
      {children}
    </section>
  );
}

export default PracticeSectionShell;
