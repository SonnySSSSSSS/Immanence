import React, { useMemo } from "react";
import { CircuitTrainingSelector } from "../practice/CircuitTrainingSelector.jsx";

export function PracticeSelector({
  selectedId,
  onSelect,
  PRACTICE_REGISTRY,
  PRACTICE_IDS,
  PRACTICE_UI_WIDTH,
}) {
  // Map practice registry to selector items format (including circuit)
  const items = useMemo(() => {
    return PRACTICE_IDS.map((id) => {
      const p = PRACTICE_REGISTRY[id];
      return {
        id: id,
        label: p.label,
        rail: getRailColor(id),
      };
    });
  }, [PRACTICE_REGISTRY, PRACTICE_IDS]);

  return (
    <div 
      className="w-full" 
      data-tutorial="practice-selector"
      style={{ 
        marginBottom: '16px',
        maxWidth: PRACTICE_UI_WIDTH.maxWidth,
        margin: '0 auto 16px auto',
        paddingLeft: PRACTICE_UI_WIDTH.padding,
        paddingRight: PRACTICE_UI_WIDTH.padding,
      }}
    >
      <CircuitTrainingSelector 
        items={items}
        value={selectedId}
        onChange={onSelect}
      />
    </div>
  );
}

// Default rail colors for practice types
function getRailColor(id) {
  const colors = {
    breath: "rgba(52,211,153,0.95)",
    integration: "rgba(245,158,11,0.95)",
    circuit: "rgba(168,85,247,0.95)",
    awareness: "rgba(56,189,248,0.95)",
    resonance: "rgba(245,158,11,0.95)",
    perception: "rgba(96,165,250,0.95)",
  };
  return colors[id] || "rgba(255,255,255,0.65)";
}
