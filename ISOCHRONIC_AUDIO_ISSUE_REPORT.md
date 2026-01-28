# Isochronic Audio Issue Report
**Date:** January 27, 2026  
**Issue:** No audio output from Isochronic Tones engine  
**Status:** Under investigation - prop aliasing fixed but audio still missing

---

## Summary
After implementing Phase 3c (minimal Isochronic panel with start/stop controls), the panel UI displays correctly and mounts properly, but **no audio is produced**. The browser DevTools console may show:
- Panel mounting/unmounting logs
- Volume effect triggers
- setPulseHz calls

But **no actual sound is heard**.

---

## Technical Context

### Architecture
- **Engine:** `src/audio/IsochronicEngine.js` (199 lines, trapezoid envelope scheduler)
- **Hook:** `src/audio/useIsochronicEngine.js` (96 lines, React lifecycle wrapper)
- **Panel:** `src/components/IsochronicTrainerPanel.jsx` (81 lines, with debug logging)
- **Config:** `src/components/SoundConfig.jsx` (volume & frequency control pass-through)

### Components in Audio Chain
```
SoundConfig (props: volume, pulseHz)
  ↓
IsochronicTrainerPanel (passes to hook)
  ↓
useIsochronicEngine (returns { start, stop, setPulseHz, setMasterGain })
  ↓
IsochronicEngine (WebAudio API implementation)
  ├─ OscillatorNode (carrierOsc, sine wave)
  ├─ GainNode (envGain, pulse envelope automation)
  ├─ GainNode (masterGain, volume control)
  └─ AudioContext destination
```

### Recent Changes That May Affect Audio
1. **IsochronicEngine.start()** (lines 127-145): 
   - Resets `envGain` and `masterGain` to known states
   - Creates new OscillatorNode and connects to envGain
   - Initializes scheduler timer at 25ms intervals

2. **IsochronicTrainerPanel** refactored to:
   - Apply volume independently (dedicated useEffect)
   - Separate frequency adjustment pause/resume logic
   - Added console logging at render and effect levels

3. **SoundConfig prop aliasing:**
   - Fixed mismatch: `soundVolume`/`setSoundVolume` → `volume`/`setVolume`
   - Added fallback logic to handle both prop name variants

---

## Debugging Checklist

### Browser Console (DevTools F12)
Check if these logs appear when selecting Isochronic Tones:

```
[Iso] Panel render. isReady: true isRunning: true volume: 0.75
[Iso] Adjustment state changed. isAdjustingFrequency: false
[Iso] Scheduling audio resume
[Iso] Resuming audio
[useIsoEngine] setMasterGain called with: 0.75
[IsoEngine] setMasterGain clamped to: 0.75
```

**If these appear but no audio:** Problem is in WebAudio API plumbing (nodes not connected/started)

**If volume logs don't appear:** Volume effect not triggering (prop not passed correctly)

**If adjustment logs don't appear:** Panel not receiving correct props from parent

---

## Suspected Root Causes

### 1. AudioContext Suspension
- AudioContext may be suspended after stop/start cycles
- `resume()` called in hook but may fail silently
- **Evidence needed:** Check `ctxRef.current.state` in console

### 2. OscillatorNode Not Starting
- `carrierOsc.start()` called but may be scheduled for wrong time
- **Check:** Line 143 in IsochronicEngine.js
- **Possible fix:** Add `start(0)` with explicit AudioContext current time

### 3. Gain Nodes at Zero
- After stop(), gains set to 0 but not properly reset in start()
- Fade-in automation may be scheduled but not visible because underlying value is 0
- **Current reset:** Lines 137-142 in IsochronicEngine.start()
- **Possible issue:** Timing of gain value reset vs oscillator connect

### 4. Envelope Scheduler Not Firing
- `_schedulerTick()` relies on 25ms `setInterval`
- GainNode automation scheduled but envelope stuck at 0
- **Check:** Are pulses being scheduled? (Add console.log in `_schedulerTick`)

### 5. Prop Chain Broken
- `volumeValue` created but not used consistently
- `setVolumeFunc` might be `undefined` (but fixed in latest change)
- **Status:** Fixed in SoundConfig prop aliasing

---

## What to Check Next

### 1. Console Logs
```javascript
// In IsochronicEngine.js _schedulerTick (add this):
console.log("[Scheduler] Scheduling pulse at:", this._nextPulseTime, "horizon:", horizon);

// In IsochronicEngine.js start() (add this):
console.log("[IsoEngine] Start called. carrierOsc:", this.carrierOsc, "isRunning:", this._isRunning);
console.log("[IsoEngine] envGain.gain.value:", this.envGain.gain.value);
console.log("[IsoEngine] masterGain.gain.value:", this.masterGain.gain.value);
```

### 2. AudioContext State
In browser console while Isochronic is running:
```javascript
// Get the AudioContext from the engine (hacky but diagnostic)
// Check if there's a way to log ctxRef.current.state after start()
```

### 3. Oscillator Connection
Verify the routing:
```
carrierOsc → envGain → masterGain → destination
```

All connections should be made before `carrierOsc.start()`.

---

## Files Modified in This Session
- ✅ `src/audio/IsochronicEngine.js` — trapezoid scheduler engine (199 lines)
- ✅ `src/audio/useIsochronicEngine.js` — React hook (96 lines)
- ✅ `src/components/IsochronicTrainerPanel.jsx` — minimal UI panel (81 lines)
- ✅ `src/components/SoundConfig.jsx` — prop aliasing fix + frequency adjustment UI
- ✅ `src/App.jsx` — version bumped

### Unmodified Audio Reference (Known Working)
- `src/audio/BinauralEngine.js` — 10-voice binaural system (works)
- `src/audio/useBinauralEngine.js` — binaural hook (works)
- `src/components/BinauralTrainerPanel.jsx` — binaural panel (works)

**Comparison tip:** Binaural audio works, so compare Isochronic engine structure against BinauralEngine to identify differences.

---

## Hypothesis
Most likely: **OscillatorNode is created but not started, OR started but gains are blocking audio from reaching destination.**

The fix likely involves:
1. Ensuring `carrierOsc.start()` is called with correct time
2. Ensuring `envGain.gain.value` is not permanently at 0
3. Ensuring scheduler is actually running and scheduling gain automation
4. Verifying all GainNode connections are intact

---

## Next Steps
1. Add diagnostic logs to `_schedulerTick()` to confirm scheduler is firing
2. Add logs to `start()` to confirm oscillator is created and started
3. Check AudioContext state after start/stop cycles
4. Compare IsochronicEngine structure with working BinauralEngine
5. If still broken: consider wrapping OscillatorNode in try/catch to catch any errors
