import React from "react";

function PracticeHeader({ isSanctuary, practiceId, onSelectPractice, selector }) {
  return (
    <>
      {/* Radial glow backdrop emanating from center (avatar area) */}
      <div
        className="practice-radial-glow"
        style={{
          position: 'fixed',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '60vh',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(233, 195, 90, 0.15) 0%, rgba(233, 195, 90, 0.08) 35%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.6,
        }}
      />

      {/* Top Layer: Practice Selector - wrapped in container with proper spacing */}
      <div style={{
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
        paddingLeft: '16px',
        paddingRight: '16px',
        marginTop: '8px',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 1,
      }}>
        {selector}
      </div>
    </>
  );
}

export default PracticeHeader;
