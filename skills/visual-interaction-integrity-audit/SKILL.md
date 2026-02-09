---
name: visual-interaction-integrity-audit
description: "Use when reviewing a UI screenshot for semantic, perceptual, or interaction integrity issues - mismatches between intent, appearance, and behavior in icons, sliders, meters, selectors, and visual emphasis. Not for redesign."
---

# Visual Interaction Integrity Audit

## Overview

Evaluate a UI screen for mismatches between **intent**, **perception**, and **behavior** — focusing on graphic elements (icons, sliders, meters, selectors, visual emphasis). Propose minimal corrections that preserve the existing aesthetic language.

This is an **audit skill**, not a redesign skill.

## When to Use

- User provides a screenshot and wants UI integrity feedback
- Reviewing a screen for false affordances, misleading precision, or signal-vs-noise problems
- Checking whether graphic elements (sliders, icons, meters) communicate truthfully
- Verifying perceptual hierarchy matches semantic importance

**When NOT to use:**
- Full UI redesigns or aesthetic overhauls
- Accessibility-only audits (use dedicated a11y tools)
- Layout or spacing critiques without interaction concerns

## Inputs

**Required:**
- A screenshot or image of the UI screen

**Optional (infer conservatively if not provided):**
- One sentence describing the screen's purpose
- User level: novice / returning / advanced

## Hard Constraints

These are mandatory and non-negotiable:

1. Do NOT suggest stylistic redesigns
2. Do NOT add visual effects, flourishes, or trends
3. Do NOT remove symbolic language unless it causes a clear integrity violation
4. Do NOT optimize for "delight," "wow," or aesthetics
5. All recommendations must be **minimal, local, and reversible**
6. If no issues are found, explicitly say so

## Analysis Phases

Execute these phases internally. Do not expose phase labels in output unless helpful.

### Phase 1 — Intended Interaction Inference

**Primary question:** What decision or action is the user supposed to make on this screen right now?

Identify:
- Primary action
- Secondary actions
- Contextual / passive elements

If intent is ambiguous, flag it immediately.

### Phase 2 — Signal vs Noise Audit

For each major visual element (icons, sliders, images, labels, accents), answer:

| Question | Flag if... |
|----------|-----------|
| What information does this encode? | Nothing meaningful |
| How much attention does it consume? | Disproportionate to importance |
| Is attention proportional to importance? | No |

**Flag these violations:**
- Decorative elements competing with controls
- Quantitative visuals implying false precision
- Lighting, glow, blur, or motion not encoding state

**Especially strict for:** Sliders, progress indicators, scales, meters.

### Phase 3 — Perceptual Coherence Check

Evaluate using perceptual principles:

| Principle | Check |
|-----------|-------|
| **Hierarchy** | What is read first, second, third? |
| **Grouping** | What appears related, and why? |
| **Affordance** | What looks interactive vs informational? |
| **Consistency** | Do similar elements behave and read similarly? |

**Flag:**
- Mixed metaphors
- False affordances
- Equal visual weight implying equal importance when untrue

### Phase 4 — Integrity Tests (Binary)

Answer yes/no for the screen as a whole:

1. Does any element imply behavior it does not support?
2. Does any element appear precise without being precise?
3. Does any element appear interactive without being interactive?
4. Does accent color consistently mean the same thing everywhere?

**Any "yes" to 1-3 or "no" to 4 is an integrity violation.**

## Output Format (Strict)

The response MUST contain exactly these four sections, in this order. No other sections.

### 1. Intended Interaction

One short paragraph: what the screen is asking the user to do.

### 2. What Works

Concrete observations of elements that are already semantically aligned. No praise words. No fluff.

### 3. Integrity Violations

Bullet list. Each item describes a specific mismatch between:
- meaning and appearance, OR
- appearance and behavior

No adjectives like "beautiful," "cool," "modern."

### 4. Minimal Corrections

Each correction must:
- Map 1:1 to a violation above
- Change as little as possible
- Preserve existing aesthetic and symbolism

If a violation cannot be corrected minimally, state that explicitly.

## Special Rules for Graphic Elements

### Icons

- If symbolic, must be reinforced by context, labels, or repetition
- If unlabeled, must be learnable without error
- Visual weight must reflect semantic importance

### Sliders (Critical)

Treat sliders as **instruments**, not decoration. Audit:

| Check | Violation if... |
|-------|----------------|
| Is the scale continuous or discrete? | Visual implies wrong type |
| Do visuals imply more precision than exists? | Yes |
| Do thumb, track, and ticks agree on meaning? | No |

Any ambiguity here is a **high-severity** issue.

### Lighting / Effects

- Lighting must encode state, not atmosphere
- Glow without state mapping is an integrity violation
- No implied depth without physical affordance

## Failure Mode

If the screen cannot be evaluated due to insufficient clarity, output:

> "The screen does not present a clear intended interaction. Audit cannot proceed without clarification."

Do not invent intent.

## Optional Extensions (Not Default)

These may be enabled only when explicitly requested:

- **Slider-only deep audit** — exhaustive slider instrument analysis
- **Accessibility contrast pass** — WCAG contrast ratio checks
- **Cross-screen consistency comparison** — compare two or more screens for element consistency

Do not apply unless requested.

## End Condition

The audit is complete when:
- All integrity violations are identified
- All corrections are minimal
- No aesthetic drift has occurred

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Suggesting a redesign instead of an audit | Constrain to minimal, local corrections only |
| Using praise language ("nice," "clean") | State what works factually, no adjectives |
| Inventing intent when it's ambiguous | Flag ambiguity explicitly, do not guess |
| Proposing corrections that change the aesthetic | Preserve existing visual language |
| Skipping slider precision analysis | Always check scale type, precision, and agreement |
| Adding effects to "fix" hierarchy | Remove or reduce; never add |
