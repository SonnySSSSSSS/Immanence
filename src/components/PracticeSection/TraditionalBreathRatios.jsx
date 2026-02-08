import React, { useState } from "react";

const TRADITIONAL_RATIOS = [
  {
    id: "equal-breath",
    label: "Equal Breath (Samavṛtti)",
    ratio: [4, 4, 4, 4],
    orientation: "Balance · Stability · Preparation",
  },
  {
    id: "long-hold",
    label: "Long Hold Breath",
    ratio: [4, 16, 8, 0],
    orientation: "Stillness · Discipline · Inner Focus",
  },
  {
    id: "coherent",
    label: "Coherent Breath",
    ratio: [5, 0, 5, 0],
    orientation: "Calm · Continuity · Heart Rhythm",
  },
  {
    id: "extended-exhale",
    label: "Extended Exhale",
    ratio: [4, 0, 6, 0],
    orientation: "Soothing · Release · Settling",
  },
  {
    id: "awakening-cycle",
    label: "Awakening Cycle",
    ratio: [2, 0, 4, 0],
    orientation: "Clarity · Light Activation",
  },
];

export function TraditionalBreathRatios({ onSelectRatio }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cadenceScale, setCadenceScale] = useState(1.0);

  // Calculate scaled ratio based on cadence multiplier
  const getScaledRatio = (baseRatio) => {
    return baseRatio.map((val) => {
      if (val === 0) return 0;
      const scaled = Math.round(val * cadenceScale);
      return Math.max(1, Math.min(60, scaled)); // Clamp to 1-60s
    });
  };

  const handleSelectRatio = (ratioObj) => {
    const scaledRatio = getScaledRatio(ratioObj.ratio);
    onSelectRatio(scaledRatio);
    setSelectedId(ratioObj.id); // Use unique ID for tracking
  };

  // Format ratio display
  const formatRatio = (ratio) => {
    return ratio
      .map((val) => {
        if (val === 0) return null;
        return val;
      })
      .filter((v) => v !== null)
      .join(" – ");
  };

  return (
    <div
      className="space-y-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(0, 0, 0, 0.1) 100%)",
        backdropFilter: "blur(32px) saturate(160%)",
        WebkitBackdropFilter: "blur(32px) saturate(160%)",
        borderRadius: "16px",
        padding: "14px",
        border: "1px solid rgba(212, 175, 55, 0.12)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        marginBottom: "8px",
      }}
    >
      {/* Ratio Cards */}
      <div className="space-y-2">
        {TRADITIONAL_RATIOS.map((r) => (
          <button
            key={r.id}
            onClick={() => handleSelectRatio(r)}
            style={{
              display: "block",
              width: "100%",
              padding: "9px 12px",
              background:
                selectedId === r.id
                  ? "rgba(212, 175, 55, 0.2)"
                  : "rgba(255, 255, 255, 0.03)",
              border:
                selectedId === r.id
                  ? "1px solid rgba(212, 175, 55, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "8px",
              color: "rgba(255, 255, 255, 0.9)",
              cursor: "pointer",
              transition: "all 200ms",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (selectedId !== r.id) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedId !== r.id) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.03em",
                marginBottom: "2px",
              }}
            >
              {r.label}
            </div>
            <div
              style={{
                fontSize: "10px",
                opacity: 0.6,
                marginBottom: "4px",
              }}
            >
              {formatRatio(r.ratio)}
            </div>
            <div
              style={{
                fontSize: "9px",
                opacity: 0.5,
              }}
            >
              {r.orientation}
            </div>
          </button>
        ))}
      </div>

      {/* Advanced Toggle */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(212, 175, 55, 0.8)",
            fontSize: "10px",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: "0",
          }}
        >
          {showAdvanced ? "▼ Advanced" : "▶ Advanced"}
        </button>

        {showAdvanced && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <label
              style={{
                display: "block",
                fontSize: "10px",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.5)",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Cadence
            </label>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setCadenceScale(Math.max(0.5, cadenceScale - 0.25))}
                style={{
                  width: "32px",
                  height: "32px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  color: "rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                −
              </button>

              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.25"
                value={cadenceScale}
                onChange={(e) => setCadenceScale(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  height: "4px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "2px",
                  outline: "none",
                  accentColor: "rgba(212, 175, 55, 0.8)",
                  cursor: "pointer",
                }}
              />

              <button
                onClick={() => setCadenceScale(Math.min(5.0, cadenceScale + 0.25))}
                style={{
                  width: "32px",
                  height: "32px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  color: "rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
