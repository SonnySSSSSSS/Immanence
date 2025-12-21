// src/components/Application/VoiceInput.jsx
// Voice-to-text input with preview modal
// Uses Web Speech API (works on Chrome, Safari iOS 14.5+, Edge)

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Check if Speech Recognition is available
const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

// Preview Modal - shows transcription before confirming
function VoicePreviewModal({ isOpen, transcript, onConfirm, onEdit, onCancel, onRetry }) {
    const [editMode, setEditMode] = useState(false);
    const [editedText, setEditedText] = useState(transcript);
    const inputRef = useRef(null);

    // Sync edited text when transcript changes
    useEffect(() => {
        setEditedText(transcript);
        setEditMode(false);
    }, [transcript]);

    // Focus input when entering edit mode
    useEffect(() => {
        if (editMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editMode]);

    const handleConfirm = () => {
        onConfirm(editMode ? editedText : transcript);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-[60]"
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[61] max-w-sm mx-auto"
                        style={{
                            background: 'linear-gradient(180deg, rgba(20,20,35,0.98) 0%, rgba(15,15,25,0.99) 100%)',
                            borderRadius: '16px',
                            border: '1px solid var(--accent-20)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        }}
                    >
                        {/* Header */}
                        <div className="px-4 pt-4 pb-2 text-center">
                            <div
                                className="text-[10px] uppercase tracking-[0.2em]"
                                style={{ color: 'var(--accent-color)', opacity: 0.7 }}
                            >
                                Voice Transcription
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-4 pb-4">
                            {editMode ? (
                                <textarea
                                    ref={inputRef}
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="w-full px-3 py-3 rounded-lg text-base bg-white/5 border border-white/20 focus:border-[var(--accent-40)] focus:outline-none resize-none"
                                    style={{
                                        fontFamily: "'Crimson Pro', serif",
                                        color: 'rgba(255,255,255,0.9)',
                                        minHeight: '80px',
                                    }}
                                />
                            ) : (
                                <div
                                    className="py-4 px-3 rounded-lg text-center min-h-[60px] flex items-center justify-center"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <p
                                        className="text-base"
                                        style={{
                                            fontFamily: "'Crimson Pro', serif",
                                            color: transcript ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                                            fontStyle: transcript ? 'normal' : 'italic',
                                        }}
                                    >
                                        {transcript || 'No speech detected...'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-4 pb-4 flex gap-2">
                            {/* Cancel */}
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: 'rgba(255,255,255,0.5)',
                                }}
                            >
                                Cancel
                            </button>

                            {/* Edit / Retry */}
                            {editMode ? (
                                <button
                                    onClick={onRetry}
                                    className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'rgba(255,255,255,0.7)',
                                    }}
                                >
                                    🎤 Re-dictate
                                </button>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'rgba(255,255,255,0.7)',
                                    }}
                                >
                                    Edit
                                </button>
                            )}

                            {/* Confirm */}
                            <button
                                onClick={handleConfirm}
                                disabled={!transcript && !editedText}
                                className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all"
                                style={{
                                    background: 'var(--accent-15)',
                                    border: '1px solid var(--accent-40)',
                                    color: 'var(--accent-color)',
                                    opacity: (transcript || editedText) ? 1 : 0.4,
                                }}
                            >
                                Use This
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Main VoiceInput component - mic button + preview modal
export function VoiceInput({ onTranscription, lang = 'en-US', className = '' }) {
    const [isListening, setIsListening] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef(null);

    // Check API availability
    const isSupported = !!SpeechRecognition;

    // Initialize recognition
    const initRecognition = useCallback(() => {
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }

            if (final) {
                setTranscript((prev) => prev + final);
            }
            setInterimTranscript(interim);
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
            // Show preview after recognition ends (only if we have content)
            setTranscript((currentTranscript) => {
                if (currentTranscript) {
                    setShowPreview(true);
                }
                return currentTranscript;
            });
        };

        recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                // Show preview even on error if we have partial transcript
                setTranscript((currentTranscript) => {
                    if (currentTranscript) {
                        setShowPreview(true);
                    }
                    return currentTranscript;
                });
            }
        };

        return recognition;
    }, [lang]);

    // Start listening
    const startListening = useCallback(() => {
        if (!isSupported) return;

        // Reset state
        setTranscript('');
        setInterimTranscript('');
        setShowPreview(false);

        const recognition = initRecognition();
        if (recognition) {
            recognitionRef.current = recognition;
            try {
                recognition.start();
                setIsListening(true);
            } catch (err) {
                console.error('Failed to start speech recognition:', err);
            }
        }
    }, [isSupported, initRecognition]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    // Handle mic button click
    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // Handle confirm from preview
    const handleConfirm = (text) => {
        setShowPreview(false);
        setTranscript('');
        onTranscription?.(text);
    };

    // Handle cancel
    const handleCancel = () => {
        setShowPreview(false);
        setTranscript('');
    };

    // Handle retry (re-dictate)
    const handleRetry = () => {
        setShowPreview(false);
        setTranscript('');
        // Small delay to allow modal to close
        setTimeout(() => startListening(), 100);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // Don't render if not supported
    if (!isSupported) {
        return null;
    }

    return (
        <>
            {/* Mic Button */}
            <motion.button
                onClick={handleMicClick}
                className={`relative flex items-center justify-center transition-all ${className}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isListening
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${isListening ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.15)'}`,
                }}
                title={isListening ? 'Stop dictation' : 'Start dictation'}
            >
                {/* Mic icon */}
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isListening ? '#ef4444' : 'rgba(255,255,255,0.6)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>

                {/* Pulsing indicator when listening */}
                {isListening && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            border: '2px solid rgba(239, 68, 68, 0.5)',
                        }}
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.8, 0.3, 0.8],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )}
            </motion.button>

            {/* Live transcript indicator (while listening) */}
            <AnimatePresence>
                {isListening && (interimTranscript || transcript) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed bottom-20 left-4 right-4 z-50 text-center"
                    >
                        <div
                            className="inline-block px-4 py-2 rounded-full text-sm"
                            style={{
                                background: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.8)',
                                maxWidth: '80%',
                            }}
                        >
                            {transcript}
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{interimTranscript}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <VoicePreviewModal
                isOpen={showPreview}
                transcript={transcript}
                onConfirm={handleConfirm}
                onEdit={() => { }}
                onCancel={handleCancel}
                onRetry={handleRetry}
            />
        </>
    );
}

export default VoiceInput;
