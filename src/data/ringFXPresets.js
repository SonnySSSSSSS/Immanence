// src/data/ringFXPresets.js
// CURATED FX PRESETS - 6 finalists v4

export const MAX_PARTICLE_COUNT = 80;
export const MAX_TRAIL_LENGTH = 0.8;

export const ringFXPresets = [
    // ═══════════════════════════════════════════════════════════════════════════
    // 1. SUN RAYS - Constant expand, hyperspace on exhale
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'sun-rays-01',
        name: 'Sun Rays',
        category: 'Light',
        status: 'candidate',
        particleType: 'thin-ray',
        motionPattern: 'hyperspace-rays',
        particleCount: 20,
        particleSize: { min: 1, max: 2 },
        colorModifier: { hueShift: -10, saturation: 1.1, brightness: 1.4, opacity: 0.85 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.4, glow: 0.8, raySpeed: 0.5, rayLength: 1.0 },
            hold: { speed: 0.3, glow: 1.0, raySpeed: 0.3, rayLength: 1.5 },
            exhale: { speed: 1.5, glow: 0.9, raySpeed: 2.0, rayLength: 2.5 },
            rest: { speed: 0.2, glow: 0.4, raySpeed: 0.3, rayLength: 1.0 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. STARBURST - Approved ✓
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'starburst-02',
        name: 'Starburst',
        category: 'Light',
        status: 'candidate',
        particleType: 'twinkle-star',
        motionPattern: 'starfield-smooth',
        particleCount: 35,
        particleSize: { min: 1, max: 3 },
        colorModifier: { hueShift: 0, saturation: 1.2, brightness: 1.5, opacity: 0.9 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.08, glow: 1.0, scale: 1.15 },
            hold: { speed: 0.03, glow: 1.0, scale: 1.15, twinkle: true },
            exhale: { speed: 0.08, glow: 0.5, scale: 0.85 },
            rest: { speed: 0.02, glow: 0.3, scale: 1.0 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. EMBERS - 30% center, 70% sides
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'embers-03',
        name: 'Embers',
        category: 'Nature',
        status: 'candidate',
        particleType: 'ember-pop',
        motionPattern: 'ember-mixed',
        particleCount: 28,
        particleSize: { min: 2, max: 5 },
        colorModifier: { hueShift: -25, saturation: 1.4, brightness: 1.3, opacity: 0.95 },
        trailLength: 0.4,
        breathSync: {
            inhale: { speed: 0.5, glow: 0.9, spawn: true },
            hold: { speed: 0.4, glow: 1.0, spawn: false },
            exhale: { speed: 0.6, glow: 0.7, spawn: true },
            rest: { speed: 0.3, glow: 0.5, spawn: false }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. ELECTRIC CURRENT - Varied sizes, directions, speeds
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'electric-04',
        name: 'Shimmer Ring',  // Renamed from Electric Current
        category: 'Energy',
        status: 'final',  // APPROVED by user
        particleType: 'lightning-arc',
        motionPattern: 'electric-varied',
        particleCount: 5,  // Sparse drift particles (3-6 range)
        particleSize: { min: 1, max: 2 },  // Small drift sparks
        colorModifier: { hueShift: 180, saturation: 1.2, brightness: 1.0, opacity: 0.4 },  // Reduced brightness
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.5, glow: 0.6, intensity: 0.7 },
            hold: { speed: 0.3, glow: 0.5, intensity: 0.6 },
            exhale: { speed: 0.7, glow: 0.6, intensity: 0.8 },
            rest: { speed: 0.2, glow: 0.4, intensity: 0.5 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 4b. PLASMA CURRENT - Directional, sci-fi, dynamic energy flow
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'plasma-current-07',
        name: 'Plasma Current',
        category: 'Energy',
        status: 'final',  // APPROVED by user
        particleType: 'plasma-arc',
        motionPattern: 'plasma-directional',
        particleCount: 5,
        particleSize: { min: 1.5, max: 3 },
        colorModifier: { hueShift: 180, saturation: 1.4, brightness: 1.2, opacity: 0.6 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.6, glow: 0.7, intensity: 0.8, flowSpeed: 1.2 },
            hold: { speed: 0.4, glow: 0.6, intensity: 0.7, flowSpeed: 0.8 },
            exhale: { speed: 0.9, glow: 0.8, intensity: 0.9, flowSpeed: 2.0 },
            rest: { speed: 0.3, glow: 0.5, intensity: 0.6, flowSpeed: 0.6 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 4c. PLASMA CURRENT V2 - Refined with inner core + echo + amplitude variation
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'plasma-v2-08',
        name: 'Plasma Current v2',
        category: 'Energy',
        status: 'candidate',
        particleType: 'plasma-v2',
        motionPattern: 'plasma-refined',
        particleCount: 5,
        particleSize: { min: 1.5, max: 3 },
        colorModifier: { hueShift: 180, saturation: 1.4, brightness: 1.3, opacity: 0.65 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.6, glow: 0.75, intensity: 0.85, flowSpeed: 1.5 },
            hold: { speed: 0.4, glow: 0.65, intensity: 0.75, flowSpeed: 1.0 },
            exhale: { speed: 0.9, glow: 0.85, intensity: 0.95, flowSpeed: 2.5 },
            rest: { speed: 0.3, glow: 0.55, intensity: 0.65, flowSpeed: 0.8 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // A. PLASMA RIBBON - Elegant, silk-like flowing energy
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'plasma-ribbon-09',
        name: 'Plasma Ribbon',
        category: 'Energy',
        status: 'candidate',
        particleType: 'plasma-ribbon',
        motionPattern: 'ribbon-flow',
        particleCount: 3,
        particleSize: { min: 1, max: 2 },
        colorModifier: { hueShift: 200, saturation: 1.1, brightness: 1.0, opacity: 0.5 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.3, glow: 0.6, intensity: 0.6, flowSpeed: 0.8 },
            hold: { speed: 0.2, glow: 0.5, intensity: 0.5, flowSpeed: 0.5 },
            exhale: { speed: 0.4, glow: 0.7, intensity: 0.7, flowSpeed: 1.2 },
            rest: { speed: 0.15, glow: 0.4, intensity: 0.4, flowSpeed: 0.4 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // B. CIRCUIT PULSE - Digital, sharp, sci-fi UI style
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'circuit-pulse-10',
        name: 'Circuit Pulse',
        category: 'Energy',
        status: 'candidate',
        particleType: 'circuit-line',
        motionPattern: 'circuit-pulse',
        particleCount: 8,
        particleSize: { min: 1, max: 2 },
        colorModifier: { hueShift: 160, saturation: 1.6, brightness: 1.4, opacity: 0.7 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.5, glow: 0.8, intensity: 0.8, pulseRate: 2.0 },
            hold: { speed: 0.3, glow: 0.7, intensity: 0.7, pulseRate: 1.0 },
            exhale: { speed: 0.8, glow: 0.9, intensity: 0.9, pulseRate: 4.0 },
            rest: { speed: 0.2, glow: 0.5, intensity: 0.5, pulseRate: 0.5 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // C. SOLAR FLARE ARC - Heat distortion, yellow-orange-red gradient
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'solar-flare-11',
        name: 'Solar Flare Arc',
        category: 'Energy',
        status: 'candidate',
        particleType: 'solar-flare',
        motionPattern: 'flare-turbulence',
        particleCount: 6,
        particleSize: { min: 2, max: 4 },
        colorModifier: { hueShift: -30, saturation: 1.5, brightness: 1.5, opacity: 0.7 },
        trailLength: 0.2,
        breathSync: {
            inhale: { speed: 0.4, glow: 0.9, intensity: 0.8, turbulence: 1.5 },
            hold: { speed: 0.3, glow: 1.0, intensity: 0.9, turbulence: 1.0 },
            exhale: { speed: 0.6, glow: 0.8, intensity: 0.7, turbulence: 2.5 },
            rest: { speed: 0.2, glow: 0.6, intensity: 0.5, turbulence: 0.8 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // D. ETHEREAL WISPS - Magical, minimal, drift-particle dominant
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'ethereal-wisps-12',
        name: 'Ethereal Wisps',
        category: 'Energy',
        status: 'candidate',
        particleType: 'wisp-particle',
        motionPattern: 'wisp-drift',
        particleCount: 12,
        particleSize: { min: 1, max: 3 },
        colorModifier: { hueShift: 220, saturation: 0.8, brightness: 1.2, opacity: 0.4 },
        trailLength: 0.5,
        breathSync: {
            inhale: { speed: 0.2, glow: 0.5, intensity: 0.5, wispSpeed: 0.8 },
            hold: { speed: 0.1, glow: 0.6, intensity: 0.6, wispSpeed: 0.4 },
            exhale: { speed: 0.3, glow: 0.4, intensity: 0.4, wispSpeed: 1.2 },
            rest: { speed: 0.1, glow: 0.3, intensity: 0.3, wispSpeed: 0.3 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // E. CHAOTIC LIGHTNING - Aggressive halo, high amplitude, branching
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'chaotic-lightning-13',
        name: 'Chaotic Lightning',
        category: 'Energy',
        status: 'candidate',
        particleType: 'chaos-arc',
        motionPattern: 'chaos-electric',
        particleCount: 8,
        particleSize: { min: 2, max: 4 },
        colorModifier: { hueShift: 170, saturation: 1.6, brightness: 1.6, opacity: 0.8 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.7, glow: 0.9, intensity: 0.9, chaosLevel: 1.5 },
            hold: { speed: 0.5, glow: 0.8, intensity: 0.8, chaosLevel: 1.0 },
            exhale: { speed: 1.2, glow: 1.0, intensity: 1.0, chaosLevel: 3.0 },
            rest: { speed: 0.3, glow: 0.6, intensity: 0.6, chaosLevel: 0.8 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // F. QUANTUM RIPPLE - Wave-based radius oscillation, futuristic
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'quantum-ripple-14',
        name: 'Quantum Ripple',
        category: 'Energy',
        status: 'candidate',
        particleType: 'ripple-wave',
        motionPattern: 'quantum-wave',
        particleCount: 4,
        particleSize: { min: 1, max: 2 },
        colorModifier: { hueShift: 240, saturation: 1.3, brightness: 1.1, opacity: 0.55 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.4, glow: 0.7, intensity: 0.7, waveFreq: 3, waveAmp: 4 },
            hold: { speed: 0.2, glow: 0.8, intensity: 0.8, waveFreq: 2, waveAmp: 3 },
            exhale: { speed: 0.6, glow: 0.6, intensity: 0.6, waveFreq: 5, waveAmp: 6 },
            rest: { speed: 0.15, glow: 0.5, intensity: 0.5, waveFreq: 2, waveAmp: 2 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. SNOWGLOBE - More particles, move on hold, color variations
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'snowglobe-05',
        name: 'Snowglobe',
        category: 'Nature',
        status: 'candidate',
        particleType: 'snow-varied',
        motionPattern: 'snowglobe-active',
        particleCount: 70,
        particleSize: { min: 1, max: 4 },
        colorModifier: { hueShift: 0, saturation: 0.2, brightness: 1.5, opacity: 0.8 },
        trailLength: 0.1,
        breathSync: {
            inhale: { speed: 0.6, glow: 0.65, shake: true },
            hold: { speed: 0.25, glow: 0.8, shake: false },
            exhale: { speed: 0.35, glow: 0.55, shake: false },
            rest: { speed: 0.15, glow: 0.45, shake: false }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. METEOR SHOWER - Alternate direction each cycle
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'meteor-shower-06',
        name: 'Meteor Shower',
        category: 'Cosmic',
        status: 'candidate',
        particleType: 'meteor-thin',
        motionPattern: 'meteor-cycle',
        particleCount: 22,
        particleSize: { min: 1, max: 3 },
        colorModifier: { hueShift: -15, saturation: 1.2, brightness: 1.3, opacity: 0.65 },
        trailLength: 0.8,
        breathSync: {
            inhale: { speed: 0.15, glow: 0.4, phase: 'cloud' },
            hold: { speed: 0.0, glow: 0.5, phase: 'stop' },
            exhale: { speed: 1.5, glow: 0.85, phase: 'rain' },
            rest: { speed: 0.05, glow: 0.2, phase: 'fade' }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 15. AETHER CURRENT - Flowing river of particles hugging the ring
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'aether-current-15',
        name: 'Aether Current',
        category: 'Ethereal',
        status: 'candidate',
        particleType: 'aether-mote',
        motionPattern: 'aether-flow',
        particleCount: 50,
        particleSize: { min: 1, max: 2 },
        colorModifier: { hueShift: 30, saturation: 0.8, brightness: 1.3, opacity: 0.7 },
        trailLength: 0.2,
        breathSync: {
            inhale: { speed: 1.2, glow: 0.7, flowSpeed: 1.5 },
            hold: { speed: 0.3, glow: 0.5, flowSpeed: 0.3 },
            exhale: { speed: 0.6, glow: 0.6, flowSpeed: 0.8 },
            rest: { speed: 0.4, glow: 0.4, flowSpeed: 0.5 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 16. SINGULARITY SHEAR - Spacetime distortion around the ring
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'singularity-shear-16',
        name: 'Singularity Shear',
        category: 'Cosmic',
        status: 'candidate',
        particleType: 'distortion-arc',
        motionPattern: 'singularity-warp',
        particleCount: 2,
        particleSize: { min: 1, max: 1 },
        colorModifier: { hueShift: 200, saturation: 0.6, brightness: 0.9, opacity: 0.2 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.5, glow: 0.4, distortAmp: 4, noiseScale: 2.0 },
            hold: { speed: 0.2, glow: 0.5, distortAmp: 2, noiseScale: 1.5 },
            exhale: { speed: 0.4, glow: 0.35, distortAmp: 3, noiseScale: 1.8 },
            rest: { speed: 0.2, glow: 0.3, distortAmp: 1.5, noiseScale: 1.2 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 17. CELESTIAL HARMONICS - Mandala-like oscillating rings
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'celestial-harmonics-17',
        name: 'Celestial Harmonics',
        category: 'Sacred',
        status: 'candidate',
        particleType: 'harmonic-ring',
        motionPattern: 'celestial-oscillate',
        particleCount: 4,
        particleSize: { min: 1, max: 1 },
        colorModifier: { hueShift: 60, saturation: 0.7, brightness: 1.1, opacity: 0.15 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.6, glow: 0.5, amplitude: 3, frequencies: [3, 5, 7, 9] },
            hold: { speed: 0.1, glow: 0.6, amplitude: 1, frequencies: [0, 0, 0, 0] },
            exhale: { speed: 0.5, glow: 0.4, amplitude: 2.5, frequencies: [4, 6, 8, 10] },
            rest: { speed: 0.2, glow: 0.3, amplitude: 1.5, frequencies: [2, 3, 4, 5] }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 18. DRAGON VEINS - Serpentine ley line energy
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'dragon-veins-18',
        name: 'Dragon Veins',
        category: 'Elemental',
        status: 'candidate',
        particleType: 'dragon-arc',
        motionPattern: 'dragon-flow',
        particleCount: 3,
        particleSize: { min: 1, max: 2 },
        colorModifier: { hueShift: -30, saturation: 1.3, brightness: 1.2, opacity: 0.5 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.4, glow: 0.7, amplitude: 6, jitter: 0.5 },
            hold: { speed: 0.2, glow: 0.6, amplitude: 4, jitter: 0.3 },
            exhale: { speed: 0.3, glow: 0.5, amplitude: 5, jitter: 0.4 },
            rest: { speed: 0.15, glow: 0.4, amplitude: 3, jitter: 0.2 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 19. ORBITAL FIRE - Embers orbiting the ring
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'orbital-fire-19',
        name: 'Orbital Fire',
        category: 'Nature',
        status: 'candidate',
        particleType: 'orbital-ember',
        motionPattern: 'orbital-fire',
        particleCount: 12,
        particleSize: { min: 2, max: 4 },
        colorModifier: { hueShift: -25, saturation: 1.4, brightness: 1.3, opacity: 0.85 },
        trailLength: 0.3,
        breathSync: {
            inhale: { speed: 1.2, glow: 0.9, orbitSpeed: 1.5 },
            hold: { speed: 0.2, glow: 0.7, orbitSpeed: 0.2 },
            exhale: { speed: 0.5, glow: 0.6, orbitSpeed: 0.6 },
            rest: { speed: 0.3, glow: 0.5, orbitSpeed: 0.4 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 20. VOID BLOOM - Pulses radiating outward from ring
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'void-bloom-20',
        name: 'Void Bloom',
        category: 'Ethereal',
        status: 'candidate',
        particleType: 'bloom-pulse',
        motionPattern: 'void-pulse',
        particleCount: 5,
        particleSize: { min: 1, max: 1 },
        colorModifier: { hueShift: 180, saturation: 0.6, brightness: 1.0, opacity: 0.35 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.5, glow: 0.8, pulseRate: 1.0, pulseAmp: 40 },
            hold: { speed: 0.2, glow: 0.6, pulseRate: 0.3, pulseAmp: 20 },
            exhale: { speed: 0.4, glow: 0.5, pulseRate: 0.6, pulseAmp: 30 },
            rest: { speed: 0.15, glow: 0.4, pulseRate: 0.2, pulseAmp: 15 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 21. PRISMATIC SHARDS - Light refraction sparkles
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'prismatic-shards-21',
        name: 'Prismatic Shards',
        category: 'Light',
        status: 'candidate',
        particleType: 'prism-spark',
        motionPattern: 'prismatic-split',
        particleCount: 20,
        particleSize: { min: 1, max: 2 },
        colorModifier: { hueShift: 0, saturation: 1.5, brightness: 1.6, opacity: 0.9 },
        trailLength: 0.1,
        breathSync: {
            inhale: { speed: 0.6, glow: 1.0, splitChance: 0.4, hueShift: 15 },
            hold: { speed: 0.2, glow: 0.8, splitChance: 0.2, hueShift: 10 },
            exhale: { speed: 0.5, glow: 0.7, splitChance: 0.3, hueShift: 12 },
            rest: { speed: 0.3, glow: 0.5, splitChance: 0.15, hueShift: 8 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 22. STARDUST STREAM - Hypnotic dust flow along ring
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'stardust-stream-22',
        name: 'Stardust Stream',
        category: 'Cosmic',
        status: 'candidate',
        particleType: 'dust-mote',
        motionPattern: 'stardust-drift',
        particleCount: 40,
        particleSize: { min: 1, max: 2 },
        colorModifier: { hueShift: 20, saturation: 0.9, brightness: 1.2, opacity: 0.6 },
        trailLength: 0.15,
        breathSync: {
            inhale: { speed: 0.8, glow: 0.6, flowSpeed: 1.2, fallChance: 0.03 },
            hold: { speed: 0.2, glow: 0.5, flowSpeed: 0.3, fallChance: 0.01 },
            exhale: { speed: 0.5, glow: 0.5, flowSpeed: 0.7, fallChance: 0.05 },
            rest: { speed: 0.3, glow: 0.4, flowSpeed: 0.4, fallChance: 0.02 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 23. SPIRIT CHASE - Two spirit lights chasing each other
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'spirit-chase-23',
        name: 'Spirit Chase',
        category: 'Ethereal',
        status: 'candidate',
        particleType: 'spirit-light',
        motionPattern: 'spirit-orbit',
        particleCount: 2,
        particleSize: { min: 3, max: 4 },
        colorModifier: { hueShift: 45, saturation: 0.8, brightness: 1.4, opacity: 0.85 },
        trailLength: 0.4,
        breathSync: {
            inhale: { speed: 0.8, glow: 0.9, speed1: 1.5, speed2: 1.8 },
            hold: { speed: 0.3, glow: 0.7, speed1: 0.6, speed2: 0.7 },
            exhale: { speed: 0.6, glow: 0.6, speed1: 1.0, speed2: 1.3 },
            rest: { speed: 0.4, glow: 0.5, speed1: 0.8, speed2: 1.0 }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 24. BREATH OF FOREST - Leaf-shaped particles drifting
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'breath-forest-24',
        name: 'Breath of Forest',
        category: 'Nature',
        status: 'candidate',
        particleType: 'leaf-mote',
        motionPattern: 'forest-drift',
        particleCount: 25,
        particleSize: { min: 2, max: 4 },
        colorModifier: { hueShift: 80, saturation: 0.7, brightness: 0.9, opacity: 0.5 },
        trailLength: 0,
        breathSync: {
            inhale: { speed: 0.3, glow: 0.5, fallSpeed: 0.4, rotSpeed: 0.5 },
            hold: { speed: 0.15, glow: 0.4, fallSpeed: 0.2, rotSpeed: 0.3 },
            exhale: { speed: 0.6, glow: 0.45, fallSpeed: 0.8, rotSpeed: 0.7 },
            rest: { speed: 0.2, glow: 0.35, fallSpeed: 0.3, rotSpeed: 0.4 }
        }
    }
];

// Helper functions
export function getPresets(statusFilter = null) {
    if (!statusFilter) return ringFXPresets;
    return ringFXPresets.filter(p => p.status === statusFilter);
}

export function getPresetById(id) {
    return ringFXPresets.find(p => p.id === id) || null;
}

export function getPresetsByCategory(category) {
    return ringFXPresets.filter(p => p.category === category);
}

export function getCategories() {
    return [...new Set(ringFXPresets.map(p => p.category))];
}

export function clampPreset(preset) {
    return {
        ...preset,
        particleCount: Math.min(preset.particleCount, MAX_PARTICLE_COUNT),
        trailLength: Math.min(preset.trailLength, MAX_TRAIL_LENGTH)
    };
}
