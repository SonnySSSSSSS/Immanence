// src/data/trackingSchema.js
// Single source of truth schemas (plain JS objects, JSON-schema-like)

export const PATH_SCHEMA = {
  version: 1,
  required: [
    "id",
    "title",
    "durationDays",
    "summary",
    "defaultCommitment",
    "allowedPractices",
  ],
  fields: {
    id: "string", // canonical id, e.g. "initiation"
    title: "string",
    durationDays: "number",
    summary: "string",
    defaultCommitment: {
      frequency: "string", // "daily" | "flex"
      sessionsPerWeek: "number|null",
    },
    allowedPractices: "string[]", // practiceIds
    tags: "string[]|optional",
  },
};

export const SESSION_SCHEMA = {
  version: 1,
  required: [
    "id",
    "startedAt",
    "endedAt",
    "durationSec",
    "practiceId",
    "practiceMode",
    "configSnapshot",
    "completion",
  ],
  fields: {
    id: "string", // uuid
    startedAt: "string", // ISO
    endedAt: "string", // ISO
    durationSec: "number",
    practiceId: "string", // "breath" | "stillness" | etc
    practiceMode: "string|null", // e.g. "expansion" | "traditional"
    configSnapshot: "object", // persisted settings at start
    completion: "string", // "completed" | "partial" | "abandoned"
    pathContext: {
      activePathId: "string|null",
      dayIndex: "number|null", // 1..durationDays
    },
  },
};

export const ACTIVE_PATH_SCHEMA = {
  version: 1,
  required: [
    "activePathId",
    "startedAt",
    "endsAt",
    "status",
    "schedule",
  ],
  fields: {
    activePathId: "string", // canonical path id
    startedAt: "string", // ISO
    endsAt: "string", // ISO
    status: "string", // "active" | "completed" | "abandoned"
    schedule: {
      selectedTimes: "string[]", // ["06:00","20:00"] in local time
      timezone: "string|null", // IANA or null
    },
    progress: {
      sessionsCompleted: "number",
      totalMinutes: "number",
      daysPracticed: "number",
      streakCurrent: "number",
      streakBest: "number",
      lastSessionAt: "string|null",
    },
  },
};

export const PATH_REPORT_SCHEMA = {
  version: 1,
  required: [
    "pathId",
    "startedAt",
    "endedAt",
    "completion",
    "facts",
    "patterns",
    "nextSteps",
  ],
  fields: {
    pathId: "string",
    startedAt: "string", // ISO
    endedAt: "string", // ISO
    completion: "string", // "completed" | "mostly_completed" | "interrupted"
    facts: {
      sessionsCompleted: "number",
      daysElapsed: "number",
      daysPracticed: "number",
      consistencyPct: "number", // 0..100
      totalMinutes: "number",
      avgMinutesPerSession: "number",
    },
    patterns: {
      mostCommonPracticeId: "string|null",
      mostCommonMode: "string|null",
      mostCommonTimeBucket: "string|null", // "morning"|"afternoon"|"evening"|"night"
      noteLines: "string[]", // derived-only statements
    },
    nextSteps: "string[]", // ids or text labels
  },
};
