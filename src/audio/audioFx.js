// src/audio/audioFx.js
//
// Minimal, practical WebAudio FX helpers for app use.
// - Reverb: ConvolverNode with generated impulse response (no external assets)
// - Chorus: short DelayNode modulated by an LFO
//
// These return a small "rack" you can wire as:
// source -> input -> (dry/wet mix inside) -> output
//
// No engine wiring in this step.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createReverbRack(ctx, {
  wet = 0.0,        // 0..1
  seconds = 1.4,    // IR length
  decay = 2.5,      // tail decay
  preDelayMs = 12,  // small pre-delay
} = {}) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  const preDelay = ctx.createDelay();
  preDelay.delayTime.value = clamp(preDelayMs / 1000, 0, 0.08);

  const convolver = ctx.createConvolver();
  convolver.buffer = _makeImpulseResponse(ctx, seconds, decay);

  // routing
  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(preDelay);
  preDelay.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(output);

  // init mix
  const setWet = (value01) => {
    const w = clamp(Number(value01), 0, 1);
    const d = 1 - w;

    const t = ctx.currentTime;
    dryGain.gain.cancelScheduledValues(t);
    wetGain.gain.cancelScheduledValues(t);

    dryGain.gain.setValueAtTime(dryGain.gain.value, t);
    wetGain.gain.setValueAtTime(wetGain.gain.value, t);

    // small ramp to avoid zipper noise
    dryGain.gain.linearRampToValueAtTime(d, t + 0.05);
    wetGain.gain.linearRampToValueAtTime(w, t + 0.05);
  };

  setWet(wet);

  return {
    input,
    output,
    convolver,
    setWet,
  };
}

export function createChorusRack(ctx, {
  wet = 0.0,       // 0..1
  rateHz = 0.35,   // LFO rate
  depthMs = 6.0,   // modulation depth in ms
  baseDelayMs = 12 // base delay in ms
} = {}) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  const delay = ctx.createDelay();
  delay.delayTime.value = clamp(baseDelayMs / 1000, 0.001, 0.05);

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = clamp(rateHz, 0.05, 2.0);

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = clamp(depthMs / 1000, 0, 0.02);

  // LFO -> delayTime
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);

  // routing
  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(delay);
  delay.connect(wetGain);
  wetGain.connect(output);

  const setWet = (value01) => {
    const w = clamp(Number(value01), 0, 1);
    const d = 1 - w;

    const t = ctx.currentTime;
    dryGain.gain.cancelScheduledValues(t);
    wetGain.gain.cancelScheduledValues(t);

    dryGain.gain.setValueAtTime(dryGain.gain.value, t);
    wetGain.gain.setValueAtTime(wetGain.gain.value, t);

    dryGain.gain.linearRampToValueAtTime(d, t + 0.05);
    wetGain.gain.linearRampToValueAtTime(w, t + 0.05);
  };

  const setRateHz = (hz) => {
    const v = clamp(Number(hz), 0.05, 2.0);
    const t = ctx.currentTime;
    lfo.frequency.cancelScheduledValues(t);
    lfo.frequency.setValueAtTime(lfo.frequency.value, t);
    lfo.frequency.linearRampToValueAtTime(v, t + 0.05);
  };

  const setDepthMs = (ms) => {
    const v = clamp(Number(ms) / 1000, 0, 0.02);
    const t = ctx.currentTime;
    lfoGain.gain.cancelScheduledValues(t);
    lfoGain.gain.setValueAtTime(lfoGain.gain.value, t);
    lfoGain.gain.linearRampToValueAtTime(v, t + 0.05);
  };

  setWet(wet);

  // start LFO immediately (safe, silent until wet > 0)
  lfo.start();

  return {
    input,
    output,
    delay,
    lfo,
    setWet,
    setRateHz,
    setDepthMs,
  };
}

function _makeImpulseResponse(ctx, seconds, decay) {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * clamp(seconds, 0.2, 6.0)));
  const buffer = ctx.createBuffer(2, len, rate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // noise * exponential decay
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, clamp(decay, 0.5, 10.0));
    }
  }

  return buffer;
}
