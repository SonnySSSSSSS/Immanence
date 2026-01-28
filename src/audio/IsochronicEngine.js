// src/audio/IsochronicEngine.js
import { createReverbRack, createChorusRack } from "./audioFx";
//
// MVP Isochronic engine:
// - Continuous carrier oscillator (default 200 Hz)
// - Trapezoid pulse envelope scheduled on GainNode.gain
// - 50% duty cycle, ramps clamped to avoid clicks at higher Hz
// - Lookahead scheduler for stable timing
//
// No UI wiring in this step.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const ISOCHRONIC_LIMITS = {
  MIN_PULSE_HZ: 1,
  MAX_PULSE_HZ: 80,
  MIN_CARRIER_HZ: 100,
  MAX_CARRIER_HZ: 400,
  MAX_RAMP_SEC: 0.010, // 10ms
  DUTY_CYCLE: 0.5,
  RAMP_FACTOR: 0.4, // attack and release each get up to 40% of half-period
};

function calcEnvelope(pulseHz) {
  const hz = clamp(pulseHz, ISOCHRONIC_LIMITS.MIN_PULSE_HZ, ISOCHRONIC_LIMITS.MAX_PULSE_HZ);
  const period = 1 / hz;
  const half = period * ISOCHRONIC_LIMITS.DUTY_CYCLE;

  const attack = Math.min(ISOCHRONIC_LIMITS.MAX_RAMP_SEC, half * ISOCHRONIC_LIMITS.RAMP_FACTOR);
  const release = Math.min(ISOCHRONIC_LIMITS.MAX_RAMP_SEC, half * ISOCHRONIC_LIMITS.RAMP_FACTOR);
  const hold = Math.max(0, half - attack - release);

  return { hz, period, half, attack, hold, release };
}

export class IsochronicEngine {
  constructor(audioContext, destinationNode = null) {
    if (!audioContext) throw new Error("IsochronicEngine: audioContext is required");
    this.ctx = audioContext;

    // Nodes
    this.carrierOsc = null;
    this.envGain = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();

    // Routing: carrier -> env -> master -> destination
    this.envGain.gain.value = 0;
    this.masterGain.gain.value = 0.75;
    this.envGain.connect(this.masterGain);

    const dest = destinationNode || this.ctx.destination;
    this.masterGain.connect(dest);

    // FX state
    this._reverb = null;
    this._chorus = null;
    this._reverbWet = 0;
    this._chorusWet = 0;

    // Scheduler
    this._timerId = null;
    this._lookaheadMs = 25;
    this._scheduleAheadSec = 0.15;
    this._nextPulseTime = 0;

    // Params
    this._pulseHz = 10;
    this._carrierHz = 200;
    this._isRunning = false;
  }

  isRunning() {
    return this._isRunning;
  }

  setMasterGain(value01) {
    const v = clamp(Number(value01), 0, 1);
    console.log("[IsoEngine] setMasterGain clamped to:", v, "masterGain node:", this.masterGain);
    // Smooth a bit to avoid abrupt level jumps
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(v, t + 0.05);
    console.log("[IsoEngine] After ramp, gain value:", this.masterGain.gain.value);
  }

  setCarrierHz(hz) {
    const v = clamp(Number(hz), ISOCHRONIC_LIMITS.MIN_CARRIER_HZ, ISOCHRONIC_LIMITS.MAX_CARRIER_HZ);
    this._carrierHz = v;
    if (this.carrierOsc) {
      const t = this.ctx.currentTime;
      this.carrierOsc.frequency.cancelScheduledValues(t);
      this.carrierOsc.frequency.setValueAtTime(this.carrierOsc.frequency.value, t);
      this.carrierOsc.frequency.linearRampToValueAtTime(v, t + 0.05);
    }
  }

  setReverbWet(value01) {
    const v = clamp(Number(value01), 0, 1);
    this._reverbWet = v;
    if (this._reverb && this._reverb.setWet) {
      this._reverb.setWet(v);
    }
  }

  setChorusWet(value01) {
    const v = clamp(Number(value01), 0, 1);
    this._chorusWet = v;
    if (this._chorus && this._chorus.setWet) {
      this._chorus.setWet(v);
    }
  }

  setReverbSizePreset(preset) {
    if (this._reverb && this._reverb.setSizePreset) {
      this._reverb.setSizePreset(preset);
    }
  }

  setReverbParams(params) {
    if (this._reverb && this._reverb.setReverbParams) {
      this._reverb.setReverbParams(params);
    }
  }

  // MVP behavior for pulseHz changes:
  // - short fade out
  // - cancel scheduled envelopes
  // - reset nextPulseTime
  // - resume scheduling and fade in
  setPulseHz(hz) {
    const v = clamp(Number(hz), ISOCHRONIC_LIMITS.MIN_PULSE_HZ, ISOCHRONIC_LIMITS.MAX_PULSE_HZ);
    this._pulseHz = v;

    if (!this._isRunning) return;

    const t = this.ctx.currentTime;

    // Fade out quickly
    this.envGain.gain.cancelScheduledValues(t);
    this.envGain.gain.setValueAtTime(this.envGain.gain.value, t);
    this.envGain.gain.linearRampToValueAtTime(0, t + 0.05);

    // Cancel any already-scheduled future automation, and restart scheduling window
    // (We re-seed nextPulseTime slightly ahead to avoid scheduling in the past)
    this._nextPulseTime = t + 0.06;

    // Fade back in baseline (actual pulses will drive to 1 within the schedule)
    // Keep this subtle; pulses still define shape.
    // Here we just ensure we aren't stuck at 0 if scheduling starts slightly later.
    this.envGain.gain.linearRampToValueAtTime(0, t + 0.06);
  }

  start() {
    if (this._isRunning) return;

    // Create carrier oscillator
    this.carrierOsc = this.ctx.createOscillator();
    this.carrierOsc.type = "sine";
    this.carrierOsc.frequency.value = this._carrierHz;
    this.carrierOsc.connect(this.envGain);

    // FX racks (chorus -> reverb) inserted between envGain and masterGain
    this._chorus = createChorusRack(this.ctx, { wet: this._chorusWet });
    this._reverb = createReverbRack(this.ctx, { wet: this._reverbWet });

    // Rewire: envGain -> chorus -> reverb -> masterGain
    try {
      this.envGain.disconnect();
    } catch {}
    this.envGain.connect(this._chorus.input);
    this._chorus.output.connect(this._reverb.input);
    this._reverb.output.connect(this.masterGain);

    const t = this.ctx.currentTime;
    
    // Ensure gains are reset to safe defaults before starting
    this.envGain.gain.cancelScheduledValues(t);
    this.envGain.gain.setValueAtTime(0, t);
    
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(0.75, t);  // Reset to default
    
    this._nextPulseTime = t + 0.05;

    this.carrierOsc.start();
    this._isRunning = true;

    this._timerId = setInterval(() => this._schedulerTick(), this._lookaheadMs);
  }

  stop() {
    if (!this._isRunning) return;

    const t = this.ctx.currentTime;

    // Fade out envelope and master for clean stop
    this.envGain.gain.cancelScheduledValues(t);
    this.envGain.gain.setValueAtTime(this.envGain.gain.value, t);
    this.envGain.gain.linearRampToValueAtTime(0, t + 0.06);

    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(0, t + 0.06);

    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }

    if (this.carrierOsc) {
      // Stop shortly after fade completes
      try {
        this.carrierOsc.stop(t + 0.07);
      } catch {
        // ignore if already stopped
      }
      this.carrierOsc.disconnect();
      this.carrierOsc = null;
    }

    // Disconnect FX racks
    try {
      if (this._chorus) {
        this._chorus.input.disconnect();
        this._chorus.output.disconnect();
      }
      if (this._reverb) {
        this._reverb.input.disconnect();
        this._reverb.output.disconnect();
      }
    } catch {}

    this._chorus = null;
    this._reverb = null;

    // Restore default master gain so next start is not muted
    // (Do not pop: set immediately while not running)
    this.masterGain.gain.value = 0.75;
    this._isRunning = false;
  }

  _schedulerTick() {
    if (!this._isRunning) return;

    const now = this.ctx.currentTime;
    const horizon = now + this._scheduleAheadSec;

    const env = calcEnvelope(this._pulseHz);
    const g = this.envGain.gain;

    while (this._nextPulseTime < horizon) {
      const t0 = this._nextPulseTime;
      const { half, attack, hold, release, period } = env;

      // Trapezoid pulse during [t0, t0+half), then off for the remaining half period.
      g.setValueAtTime(0, t0);
      g.linearRampToValueAtTime(1, t0 + attack);
      g.setValueAtTime(1, t0 + attack + hold);
      g.linearRampToValueAtTime(0, t0 + attack + hold + release);
      g.setValueAtTime(0, t0 + half); // safety snap

      this._nextPulseTime += period;
    }
  }
}
