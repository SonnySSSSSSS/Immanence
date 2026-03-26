export const TRADITIONAL_RATIOS = [
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

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

export function coercePatternToArray(pattern) {
  if (Array.isArray(pattern)) {
    return pattern.map((value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : 0;
    });
  }

  if (!pattern || typeof pattern !== "object") {
    return [0, 0, 0, 0];
  }

  return [
    Number(pattern.inhale) || 0,
    Number(pattern.hold1) || 0,
    Number(pattern.exhale) || 0,
    Number(pattern.hold2) || 0,
  ].map((value) => Math.max(0, Math.round(value)));
}

function normalizePatternSignature(pattern) {
  const values = coercePatternToArray(pattern);
  const nonZeroValues = values.filter((value) => value > 0);
  if (!nonZeroValues.length) return null;
  const divisor = nonZeroValues.reduce((acc, value) => gcd(acc, value), nonZeroValues[0]);
  return values.map((value) => (value === 0 ? 0 : Math.round(value / divisor))).join(":");
}

export function formatTraditionalPatternCycle(pattern) {
  return coercePatternToArray(pattern).join("–");
}

export function getTraditionalPatternSummary(pattern) {
  const ratioText = formatTraditionalPatternCycle(pattern);
  const signature = normalizePatternSignature(pattern);
  const matchedRatio = signature
    ? TRADITIONAL_RATIOS.find((ratio) => normalizePatternSignature(ratio.ratio) === signature)
    : null;

  return {
    label: matchedRatio?.label || null,
    ratioText,
  };
}
