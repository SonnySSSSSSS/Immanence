// src/audio/BinauralEngine.js

const TWO_PI = Math.PI * 2;
const PHI = 1.618;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function makeSoftLimiterCurve(size = 1024, amount = 2.2) {
    const curve = new Float32Array(size);
    for (let i = 0; i < size; i += 1) {
        const x = (i / (size - 1)) * 2 - 1;
        curve[i] = Math.tanh(amount * x);
    }
    return curve;
}

export class BinauralEngine {
    constructor() {
        this.ctx = null;
        this.masterCarrier = 220;
        this.spreadMode = 'integer';
        this.spreadAmount = 1;
        this.ratio = 1;
        this.deltaF = 0;
        this.chaos = 0;
        this.isStarted = false;
        this.rafId = null;

        this.voices = [];
        this.voiceGains = new Array(10).fill(0.6);

        this.channelMerger = null;
        this.masterGain = null;
        this.limiter = null;
        this.outputGain = null;

        this.oscLeft = [];
        this.oscRight = [];
        this.gainLeft = [];
        this.gainRight = [];
    }

    init(audioContext) {
        if (this.ctx) return this;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = audioContext || new AudioContext();

        this.channelMerger = this.ctx.createChannelMerger(2);
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.25; // output ceiling

        this.limiter = this.ctx.createWaveShaper();
        this.limiter.curve = makeSoftLimiterCurve();
        this.limiter.oversample = '4x';

        this.outputGain = this.ctx.createGain();
        this.outputGain.gain.value = 0.9;

        this.channelMerger.connect(this.masterGain);
        this.masterGain.connect(this.limiter);
        this.limiter.connect(this.outputGain);
        this.outputGain.connect(this.ctx.destination);

        this._initVoices();
        this._applySpread();

        return this;
    }

    start() {
        if (!this.ctx) {
            this.init();
        }
        if (this.isStarted) return;

        this.isStarted = true;
        this._ensureOscillators();

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this._tick();
    }

    stop() {
        if (!this.isStarted) return;
        this.isStarted = false;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        for (let i = 0; i < this.oscLeft.length; i += 1) {
            const oscL = this.oscLeft[i];
            const oscR = this.oscRight[i];
            const gainL = this.gainLeft[i];
            const gainR = this.gainRight[i];
            if (gainL) gainL.gain.setValueAtTime(0, this.ctx.currentTime);
            if (gainR) gainR.gain.setValueAtTime(0, this.ctx.currentTime);
            try {
                if (oscL) oscL.stop();
                if (oscR) oscR.stop();
            } catch {
                // already stopped
            }
            if (oscL) oscL.disconnect();
            if (oscR) oscR.disconnect();
            if (gainL) gainL.disconnect();
            if (gainR) gainR.disconnect();
        }

        this.oscLeft = [];
        this.oscRight = [];
        this.gainLeft = [];
        this.gainRight = [];
    }

    setMasterCarrier(fc) {
        this.masterCarrier = clamp(fc, 40, 1200);
        this._applySpread();
    }

    setSpread(mode, amount = 1) {
        this.spreadMode = mode;
        this.spreadAmount = amount;
        this._applySpread();
    }

    setRatio(ratio) {
        this.ratio = ratio;
        for (const voice of this.voices) {
            voice.ratio = ratio;
        }
        this._updateFrequencies();
    }

    setDeltaF(deltaF) {
        this.deltaF = deltaF;
        for (const voice of this.voices) {
            voice.binauralTarget = deltaF;
        }
        this._updateFrequencies();
    }

    setChaos(amount) {
        this.chaos = clamp(amount, 0, 1);
    }

    setVoiceGain(index, gain) {
        if (index < 0 || index >= this.voiceGains.length) return;
        this.voiceGains[index] = clamp(gain, 0, 1);
    }

    _initVoices() {
        this.voices = [];
        for (let i = 0; i < 10; i += 1) {
            this.voices.push({
                baseFreq: this.masterCarrier,
                ratio: this.ratio,
                binauralTarget: this.deltaF,
                lfo: {
                    rateHz: 0.05 + i * 0.01,
                    phase: i * 0.6,
                    chaosState: 0.4 + Math.random() * 0.2,
                },
            });
        }
    }

    _applySpread() {
        if (!this.voices.length) return;

        for (let i = 0; i < this.voices.length; i += 1) {
            const multiplier = this.spreadMode === 'phi'
                ? Math.pow(PHI, i) * this.spreadAmount
                : (i + 1) * this.spreadAmount;
            const base = this.masterCarrier * multiplier;
            this.voices[i].baseFreq = clamp(base, 40, 1200);
        }

        this._updateFrequencies();
    }

    _ensureOscillators() {
        if (this.oscLeft.length) return;

        for (let i = 0; i < this.voices.length; i += 1) {
            const oscL = this.ctx.createOscillator();
            const oscR = this.ctx.createOscillator();
            const gainL = this.ctx.createGain();
            const gainR = this.ctx.createGain();

            oscL.type = 'sine';
            oscR.type = 'sine';

            gainL.gain.value = 0;
            gainR.gain.value = 0;

            oscL.connect(gainL);
            oscR.connect(gainR);

            gainL.connect(this.channelMerger, 0, 0);
            gainR.connect(this.channelMerger, 0, 1);

            oscL.start();
            oscR.start();

            this.oscLeft.push(oscL);
            this.oscRight.push(oscR);
            this.gainLeft.push(gainL);
            this.gainRight.push(gainR);
        }

        this._updateFrequencies();
    }

    _updateFrequencies() {
        if (!this.ctx || !this.oscLeft.length) return;

        const now = this.ctx.currentTime;
        for (let i = 0; i < this.voices.length; i += 1) {
            const voice = this.voices[i];
            const fL = voice.baseFreq;
            const fR = (voice.baseFreq * voice.ratio) + this.deltaF;

            if (this.oscLeft[i]) {
                this.oscLeft[i].frequency.setValueAtTime(fL, now);
            }
            if (this.oscRight[i]) {
                this.oscRight[i].frequency.setValueAtTime(fR, now);
            }
        }
    }

    _tick() {
        if (!this.isStarted) return;

        const now = this.ctx.currentTime;
        const chaosMix = this.chaos;
        const baseGain = 0.06;

        for (let i = 0; i < this.voices.length; i += 1) {
            const voice = this.voices[i];
            const lfo = voice.lfo;

            const orderGain = 0.5 + 0.5 * Math.sin(TWO_PI * lfo.rateHz * now + lfo.phase);
            lfo.chaosState += (Math.random() - 0.5) * 0.08;
            lfo.chaosState += (0.5 - lfo.chaosState) * 0.02;
            lfo.chaosState = clamp(lfo.chaosState, 0, 1);

            const finalGain = orderGain * (1 - chaosMix) + lfo.chaosState * chaosMix;
            const gainValue = finalGain * this.voiceGains[i] * baseGain;

            if (this.gainLeft[i]) {
                this.gainLeft[i].gain.setValueAtTime(gainValue, now);
            }
            if (this.gainRight[i]) {
                this.gainRight[i].gain.setValueAtTime(gainValue, now);
            }
        }

        this.rafId = requestAnimationFrame(() => this._tick());
    }
}
