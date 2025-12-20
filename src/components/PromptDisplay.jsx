// src/components/PromptDisplay.jsx
// Reusable text prompt display with audio hooks for sensory practices

import React, { useState, useEffect, useRef } from 'react';

export function PromptDisplay({ text, onAudioPlay, fadeMs = 500 }) {
    const [displayedText, setDisplayedText] = useState(text);
    const [opacity, setOpacity] = useState(1);
    const prevTextRef = useRef(text);

    useEffect(() => {
        if (text !== prevTextRef.current) {
            // Fade out
            setOpacity(0);

            const fadeTimer = setTimeout(() => {
                setDisplayedText(text);
                setOpacity(1);
                prevTextRef.current = text;

                // Trigger audio hook when new prompt appears
                if (onAudioPlay) {
                    onAudioPlay(text);
                }
            }, fadeMs);

            return () => clearTimeout(fadeTimer);
        }
    }, [text, fadeMs, onAudioPlay]);

    if (!displayedText) return null;

    return (
        <div
            className="w-full max-w-md mx-auto px-6 py-4 text-center"
            style={{
                opacity,
                transition: `opacity ${fadeMs}ms ease-in-out`,
            }}
        >
            <p
                style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '15px',
                    lineHeight: 1.7,
                    color: 'rgba(253,251,245,0.95)',
                    fontStyle: 'italic',
                    margin: 0,
                    textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.6)',
                }}
            >
                "{displayedText}"
            </p>
        </div>
    );
}
