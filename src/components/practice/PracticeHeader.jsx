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
      {/* Circuit Button - Full Width */}
      <div style={{ width: '100%', maxWidth: isSanctuary ? '656px' : '560px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => onSelectPractice('circuit')}
          className="group relative overflow-hidden transition-all duration-300 w-full flex flex-col items-center justify-center gap-3"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            padding: '12px 16px',
            minHeight: '48px',
            borderRadius: '12px',
            border: practiceId === 'circuit' ? '1.5px solid var(--accent-70)' : '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 20, 25, 0.12)',
            backdropFilter: 'blur(32px) saturate(140%)',
            WebkitBackdropFilter: 'blur(32px) saturate(140%)',
            color: practiceId === 'circuit' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.6)',
            textShadow: practiceId === 'circuit' ? '0 0 12px var(--accent-40), 0 0 24px var(--accent-20)' : 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (practiceId !== 'circuit') {
              e.currentTarget.style.background = 'rgba(20, 30, 40, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (practiceId !== 'circuit') {
              e.currentTarget.style.background = 'rgba(15, 20, 25, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent-color)' }}>CIRCUIT TRAINING</span>
        </button>
      </div>

      {/* Top Layer: Practice Selector */}
      {selector}
    </>
  );
}

export default PracticeHeader;
