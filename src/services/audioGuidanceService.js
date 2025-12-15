// src/services/audioGuidanceService.js
// Modular audio guidance system for ritual instructions
// Supports Web Speech API (default) and pre-recorded audio files (future)

/**
 * Audio Guidance Service
 * 
 * Usage:
 *   import { audioGuidance } from '../services/audioGuidanceService';
 *   
 *   // Speak text using Web Speech API
 *   audioGuidance.speak("Visualize a brilliant star above your head");
 *   
 *   // Or play pre-recorded audio (when available)
 *   audioGuidance.play("rituals/standing-meditation/step-1.mp3");
 *   
 *   // Stop current audio
 *   audioGuidance.stop();
 */

class AudioGuidanceService {
    constructor() {
        this.currentAudio = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;

        // Configuration
        this.config = {
            // Web Speech API settings
            speech: {
                rate: 0.9,           // Slightly slower for meditation
                pitch: 1.0,          // Normal pitch
                volume: 0.8,         // Slightly quieter
                voice: null,         // Will be set to preferred voice
            },
            // Pre-recorded audio settings
            audio: {
                volume: 0.7,
                fadeInDuration: 200,  // ms
                fadeOutDuration: 300, // ms
            },
        };

        this.initializeVoice();
    }

    /**
     * Initialize preferred voice for Web Speech API
     * Prefers calm, natural voices
     */
    initializeVoice() {
        if (!this.speechSynthesis) return;

        // Wait for voices to load
        const setVoice = () => {
            const voices = this.speechSynthesis.getVoices();

            // Prefer these voice names (calm, natural)
            const preferredVoices = [
                'Google US English',
                'Microsoft Zira',
                'Samantha',
                'Karen',
                'Daniel',
            ];

            // Find first available preferred voice
            for (const preferred of preferredVoices) {
                const voice = voices.find(v => v.name.includes(preferred));
                if (voice) {
                    this.config.speech.voice = voice;
                    return;
                }
            }

            // Fallback: use first English voice
            const englishVoice = voices.find(v => v.lang.startsWith('en'));
            if (englishVoice) {
                this.config.speech.voice = englishVoice;
            }
        };

        // Voices may load asynchronously
        if (this.speechSynthesis.getVoices().length > 0) {
            setVoice();
        } else {
            this.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
        }
    }

    /**
     * Speak text using Web Speech API
     * @param {string} text - Text to speak
     * @param {object} options - Override default speech settings
     */
    speak(text, options = {}) {
        this.stop(); // Stop any current audio

        if (!this.speechSynthesis) {
            console.warn('[AudioGuidance] Web Speech API not available');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || this.config.speech.rate;
        utterance.pitch = options.pitch || this.config.speech.pitch;
        utterance.volume = options.volume || this.config.speech.volume;

        if (this.config.speech.voice) {
            utterance.voice = this.config.speech.voice;
        }

        this.currentUtterance = utterance;
        this.speechSynthesis.speak(utterance);
    }

    /**
     * Play pre-recorded audio file
     * @param {string} audioPath - Path to audio file (relative to public/)
     * @param {object} options - Override default audio settings
     */
    play(audioPath, options = {}) {
        this.stop(); // Stop any current audio

        const audio = new Audio(`${import.meta.env.BASE_URL}${audioPath}`);
        audio.volume = options.volume || this.config.audio.volume;

        // Fade in
        if (this.config.audio.fadeInDuration > 0) {
            audio.volume = 0;
            const targetVolume = options.volume || this.config.audio.volume;
            const fadeStep = targetVolume / (this.config.audio.fadeInDuration / 50);
            const fadeInterval = setInterval(() => {
                if (audio.volume < targetVolume) {
                    audio.volume = Math.min(audio.volume + fadeStep, targetVolume);
                } else {
                    clearInterval(fadeInterval);
                }
            }, 50);
        }

        this.currentAudio = audio;
        audio.play().catch(err => {
            console.warn('[AudioGuidance] Failed to play audio:', err);
        });

        return audio;
    }

    /**
     * Stop current audio (speech or pre-recorded)
     */
    stop() {
        // Stop Web Speech API
        if (this.speechSynthesis && this.currentUtterance) {
            this.speechSynthesis.cancel();
            this.currentUtterance = null;
        }

        // Stop pre-recorded audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    /**
     * Check if audio is currently playing
     */
    isPlaying() {
        const speechPlaying = this.speechSynthesis && this.speechSynthesis.speaking;
        const audioPlaying = this.currentAudio && !this.currentAudio.paused;
        return speechPlaying || audioPlaying;
    }

    /**
     * Update configuration
     * @param {object} newConfig - Partial config to merge
     */
    configure(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig,
            speech: { ...this.config.speech, ...newConfig.speech },
            audio: { ...this.config.audio, ...newConfig.audio },
        };
    }
}

// Export singleton instance
export const audioGuidance = new AudioGuidanceService();

// Export class for testing or multiple instances
export { AudioGuidanceService };
