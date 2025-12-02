// Improved HomeHub component with stats overview and better visual hierarchy

import React, { useState, useEffect } from "react";
import { Avatar } from "./Avatar.jsx";

function HomeHub({ onSelectSection }) {
  // Placeholder stats - wire to real data later
  const [stats, setStats] = useState({
    totalSessions: 24,
    weeklyConsistency: 5, // days this week
    avgAccuracy: 0.78,
    currentStreak: 4, // consecutive days
    lastPracticed: "2 hours ago",
    nextStage: "Beacon",
    progressToNextStage: 0.62, // 62% toward Beacon
  });

  const accuracyPct = Math.round(stats.avgAccuracy * 100);
  const progressPct = Math.round(stats.progressToNextStage * 100);

  // Calculate stage score formula: (min(sessions, 150) / 150 × 0.35) + (accuracy × 0.65)
  const sessionScore = (Math.min(stats.totalSessions, 150) / 150) * 0.35;
  const accuracyScore = stats.avgAccuracy * 0.65;
  const stageScore = sessionScore + accuracyScore;

  return (
    <div className="w-full flex flex-col items-center gap-8 py-8">
      {/* ──────────────────────────────────────────────────────────────────────
          AVATAR SECTION - Primary focal point
          ────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-full flex items-center justify-center">
          <Avatar mode="hub" />
        </div>

        {/* Welcome message */}
        <div className="text-center space-y-1">
          <div className="text-sm text-[rgba(253,251,245,0.92)]">
            Welcome back, Wanderer
          </div>
          <div className="text-[11px] text-[rgba(253,251,245,0.4)]">
            Last practiced {stats.lastPracticed}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          STATS DASHBOARD - Quick overview of progress
          ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(253,251,245,0.65)] mb-3">
          Your Progress
        </div>

        {/* Stats grid: 4 columns on desktop, 2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Total Sessions */}
          <div className="rounded-2xl bg-gradient-to-br from-[#161625] to-[#0f0f1a] border border-[rgba(253,224,71,0.15)] px-3 py-3 backdrop-blur-sm hover:border-[rgba(253,224,71,0.35)] transition-colors">
            <div className="text-[10px] text-[rgba(253,251,245,0.65)] uppercase tracking-[0.15em] mb-2">
              Sessions
            </div>
            <div className="text-2xl font-semibold text-[#fcd34d] mb-1">
              {stats.totalSessions}
            </div>
            <div className="text-[9px] text-[rgba(253,251,245,0.4)]">
              {stats.totalSessions < 150 ? `${150 - stats.totalSessions} to unlock` : "mastery"}
            </div>
          </div>

          {/* Weekly Consistency */}
          <div className="rounded-2xl bg-gradient-to-br from-[#161625] to-[#0f0f1a] border border-[rgba(253,224,71,0.15)] px-3 py-3 backdrop-blur-sm hover:border-[rgba(253,224,71,0.35)] transition-colors">
            <div className="text-[10px] text-[rgba(253,251,245,0.65)] uppercase tracking-[0.15em] mb-2">
              This Week
            </div>
            <div className="text-2xl font-semibold text-[#fcd34d] mb-1">
              {stats.weeklyConsistency}/7
            </div>
            <div className="text-[9px] text-[rgba(253,251,245,0.4)]">
              {7 - stats.weeklyConsistency} days left
            </div>
          </div>

          {/* Accuracy */}
          <div className="rounded-2xl bg-gradient-to-br from-[#161625] to-[#0f0f1a] border border-[rgba(253,224,71,0.15)] px-3 py-3 backdrop-blur-sm hover:border-[rgba(253,224,71,0.35)] transition-colors">
            <div className="text-[10px] text-[rgba(253,251,245,0.65)] uppercase tracking-[0.15em] mb-2">
              Accuracy
            </div>
            <div className="text-2xl font-semibold text-[#fcd34d] mb-1">
              {accuracyPct}%
            </div>
            <div className="text-[9px] text-[rgba(253,251,245,0.4)]">
              {accuracyPct >= 75 ? "tight" : accuracyPct >= 40 ? "mixed" : "loose"}
            </div>
          </div>

          {/* Current Streak */}
          <div className="rounded-2xl bg-gradient-to-br from-[#161625] to-[#0f0f1a] border border-[rgba(253,224,71,0.15)] px-3 py-3 backdrop-blur-sm hover:border-[rgba(253,224,71,0.35)] transition-colors">
            <div className="text-[10px] text-[rgba(253,251,245,0.65)] uppercase tracking-[0.15em] mb-2">
              Streak
            </div>
            <div className="text-2xl font-semibold text-[#fcd34d] mb-1">
              {stats.currentStreak}
            </div>
            <div className="text-[9px] text-[rgba(253,251,245,0.4)]">
              {stats.currentStreak >= 7 ? "on 🔥" : "days"} 
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            STAGE PROGRESSION - Show path to next stage
            ────────────────────────────────────────────────────────────────── */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#161625] via-[#0f0f1a] to-[#161625] border border-[rgba(253,224,71,0.15)] px-4 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(253,251,245,0.65)]">
                Progress to Next Stage
              </div>
              <div className="text-sm font-semibold text-[#fcd34d]">
                {stats.nextStage}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-[#fcd34d]">
                {progressPct}%
              </div>
              <div className="text-[9px] text-[rgba(253,251,245,0.4)]">
                {Math.round(stageScore * 100)}% score
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-[rgba(253,224,71,0.15)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#f59e0b] via-[#fcd34d] to-[#f59e0b] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Breakdown */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[rgba(253,224,71,0.08)] rounded-lg px-2 py-1.5">
              <div className="text-[rgba(253,251,245,0.65)]">Sessions</div>
              <div className="text-[#fcd34d] font-semibold">
                {Math.round(sessionScore * 100)}% ({stats.totalSessions}/150)
              </div>
            </div>
            <div className="bg-[rgba(253,224,71,0.08)] rounded-lg px-2 py-1.5">
              <div className="text-[rgba(253,251,245,0.65)]">Accuracy</div>
              <div className="text-[#fcd34d] font-semibold">
                {Math.round(accuracyScore * 100)}% ({accuracyPct}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          MODES SECTION - Mode selection buttons
          ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(253,251,245,0.65)] mb-4">
          Explore Modes
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ModeButton
            title="Practice"
            description="Breathing & timing"
            subtext="Build consistency"
            onClick={() => onSelectSection("practice")}
          />
          <ModeButton
            title="Wisdom"
            description="Treatise & teachings"
            subtext="Deepen understanding"
            onClick={() => onSelectSection("wisdom")}
          />
          <ModeButton
            title="Application"
            description="Track gestures"
            subtext="Embody practice"
            onClick={() => onSelectSection("application")}
          />
          <ModeButton
            title="Navigation"
            description="Roadmap & goals"
            subtext="Set intentions"
            onClick={() => onSelectSection("navigation")}
          />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          QUICK INSIGHTS - Small contextual suggestions
          ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-r from-[#161625] to-[#0f0f1a] border border-[rgba(253,224,71,0.15)] px-4 py-3 backdrop-blur-sm">
        <div className="text-[10px] text-[rgba(253,251,245,0.65)] mb-2 uppercase tracking-[0.15em]">Quick Insight</div>
        <div className="text-[11px] text-[rgba(253,251,245,0.92)] leading-relaxed">
          {stats.currentStreak >= 7
            ? "🔥 You're building momentum. Keep the streak alive—7+ days unlocks deeper practice."
            : stats.avgAccuracy < 0.5
            ? "Slow down. Focus on breath timing rather than speed. Accuracy compounds over time."
            : stats.weeklyConsistency < 4
            ? "You're inconsistent this week. One practice per day keeps the alignment alive."
            : "You're in rhythm. Consider exploring the Wisdom section to deepen your understanding."}
        </div>
      </div>
    </div>
  );
}

function ModeButton({ title, description, subtext, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl bg-gradient-to-br from-[#161625] to-[#0f0f1a] px-4 py-4 text-left border border-[rgba(253,224,71,0.15)] hover:border-[rgba(253,224,71,0.35)] hover:bg-gradient-to-br hover:from-[#1a1a2e] hover:to-[#161625] transition-all duration-200 backdrop-blur-sm"
    >
      <div className="text-sm font-semibold text-[#fcd34d] group-hover:text-[#f59e0b] transition-colors">
        {title}
      </div>
      <div className="text-[11px] text-[rgba(253,251,245,0.65)] mt-1">{description}</div>
      <div className="text-[9px] text-[rgba(253,251,245,0.4)] mt-2 group-hover:text-[rgba(253,251,245,0.55)] transition-colors">
        {subtext}
      </div>
    </button>
  );
}

export { HomeHub };
