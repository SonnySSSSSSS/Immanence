// src/components/BreathPhaseIndicator.jsx
// Displays 4-circle breath phase indicator: Inhale, Hold 1, Exhale, Hold 2

import React, { useState } from 'react';

export function BreathPhaseIndicator({ inhaleCount = 4, hold1Count = 4, exhaleCount = 4, hold2Count = 4, tokens = {}, setPattern }) {
  const [hoveredPhase, setHoveredPhase] = useState(null);
  const [draggingPhase, setDraggingPhase] = useState(null);
  const [editingPhase, setEditingPhase] = useState(null);
  const [inputValue, setInputValue] = useState('');
  
  const phases = [
    { label: 'INHALE', key: 'inhale', value: inhaleCount, isActive: true },
    { label: 'HOLD 1', key: 'hold1', value: hold1Count, isActive: false },
    { label: 'EXHALE', key: 'exhale', value: exhaleCount, isActive: true },
    { label: 'HOLD 2', key: 'hold2', value: hold2Count, isActive: false },
  ];

  const handlePhaseChange = (key, newValue) => {
    const clamped = Math.max(1, Math.min(60, newValue));
    if (setPattern) {
      setPattern(prev => ({
        ...prev,
        [key]: clamped,
      }));
    }
  };

  const handleWheel = (e, key) => {
    e.preventDefault();
    const currentPhase = phases.find(p => p.key === key);
    const delta = e.deltaY > 0 ? -1 : 1;
    handlePhaseChange(key, currentPhase.value + delta);
  };

  const handleMouseDown = (key) => {
    setDraggingPhase(key);
  };

  const handleMouseMove = (e, key) => {
    if (draggingPhase === key) {
      const delta = e.movementY < -2 ? 1 : e.movementY > 2 ? -1 : 0;
      if (delta !== 0) {
        const currentPhase = phases.find(p => p.key === key);
        handlePhaseChange(key, currentPhase.value + delta);
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingPhase(null);
  };

  const handleClick = (key, value) => {
    setEditingPhase(key);
    setInputValue(value.toString());
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setInputValue(val);
    }
  };

  const handleInputBlur = () => {
    if (editingPhase && inputValue !== '') {
      const parsed = Number.parseInt(inputValue, 10);
      if (!Number.isNaN(parsed)) {
        const clamped = Math.min(60, Math.max(1, parsed));
        handlePhaseChange(editingPhase, clamped);
      }
    }
    setEditingPhase(null);
    setInputValue('');
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingPhase(null);
      setInputValue('');
    }
  };

  return (
    <div 
      className="flex justify-center items-center gap-5 w-full"
      style={{ marginBottom: '24px' }}
    >
      {phases.map((phase) => (
        <div
          key={phase.label}
          className="flex flex-col items-center gap-3"
          onMouseLeave={() => setHoveredPhase(null)}
        >
          <div
            className="rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer select-none"
            onMouseEnter={() => setHoveredPhase(phase.key)}
            onMouseDown={() => handleMouseDown(phase.key)}
            onMouseUp={handleMouseUp}
            onMouseMove={(e) => handleMouseMove(e, phase.key)}
            onMouseLeave={handleMouseUp}
            onWheel={(e) => handleWheel(e, phase.key)}
            onClick={() => handleClick(phase.key, phase.value)}
            style={{
              width: '64px',
              height: '64px',
              border: `2.5px solid ${phase.isActive ? tokens.accent || 'var(--accent-color)' : tokens.textMuted || 'rgba(253,251,245,0.4)'}`,
              background: `linear-gradient(135deg, ${phase.isActive ? (tokens.accent || 'var(--accent-color)') + '35' : 'rgba(255,255,255,0.08)'} 0%, ${phase.isActive ? (tokens.accent || 'var(--accent-color)') + '15' : 'rgba(255,255,255,0.02)'} 100%),
                         repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)`,
              color: phase.isActive 
                ? (tokens.accent || 'var(--accent-color)') 
                : (tokens.textMuted || 'rgba(253,251,245,0.7)'),
              boxShadow: phase.isActive 
                ? `0 0 16px ${tokens.accent || 'var(--accent-color)'}50, inset 0 0 10px ${tokens.accent || 'var(--accent-color)'}25, inset 0 0 20px rgba(255,255,255,0.05)`
                : `inset 0 0 15px rgba(255,255,255,0.03)`,
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              transform: hoveredPhase === phase.key ? 'scale(1.08)' : 'scale(1)',
              opacity: draggingPhase === phase.key ? 0.9 : 1,
            }}
          >
            {editingPhase === phase.key ? (
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                autoFocus
                style={{
                  width: '48px',
                  height: '36px',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  border: `1px solid ${tokens.accent || 'var(--accent-color)'}`,
                  borderRadius: '8px',
                  color: tokens.accent || 'var(--accent-color)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 800,
                  outline: 'none',
                }}
              />
            ) : (
              phase.value
            )}
          </div>
          <span
            className="text-[10px] font-black uppercase tracking-wider text-center leading-none"
            style={{
              color: phase.isActive 
                ? (tokens.accent || 'var(--accent-color)') 
                : (tokens.textMuted || 'rgba(253,251,245,0.5)'),
              letterSpacing: '0.08em',
              fontSize: '9px',
            }}
          >
            {phase.label}
          </span>
        </div>
      ))}
    </div>
  );
}
