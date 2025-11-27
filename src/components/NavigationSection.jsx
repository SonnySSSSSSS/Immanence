import React, { useState } from "react";

const plans = {
  shadow: {
    label: "Integrate Shadow Work",
    weeks: ["Notice reactivity patterns", "Journal after conflict"],
  },
  consistency: {
    label: "Develop Consistent Practice",
    weeks: ["5 minutes daily", "Same time each day"],
  },
  nonduality: {
    label: "Understand Non-Duality",
    weeks: ["Observe thoughts as passing", 'Ask "what is aware?" once/day'],
  },
};

export function NavigationSection() {
  const [goal, setGoal] = useState("shadow");
  const current = plans[goal];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1">
          Select Goal
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <GoalChip
            label="Shadow Work"
            active={goal === "shadow"}
            onClick={() => setGoal("shadow")}
          />
          <GoalChip
            label="Consistency"
            active={goal === "consistency"}
            onClick={() => setGoal("consistency")}
          />
          <GoalChip
            label="Non-Duality"
            active={goal === "nonduality"}
            onClick={() => setGoal("nonduality")}
          />
        </div>
      </div>

      <div className="flex-1 rounded-2xl bg-black/25 border border-white/12 px-3 py-2 overflow-y-auto text-[11px]">
        <div className="text-sm font-semibold mb-2">{current.label}</div>
        {current.weeks.map((w, i) => (
          <div
            key={i}
            className="mb-1 pb-1 border-b border-white/10 last:border-b-0 last:pb-0"
          >
            <span className="font-semibold">Week {i + 1}:</span> {w}
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap ${
        active
          ? "bg-white text-bgStart border-white"
          : "border-white/30 text-white/80"
      }`}
    >
      {label}
    </button>
  );
}
