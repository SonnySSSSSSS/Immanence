// SpeechToTextInput.jsx
// Speech-to-text input component for thought catalog onboarding

import React, { useState, useEffect } from 'react';
import { useDisplayModeStore } from '../state/displayModeStore';

export function SpeechToTextInput({ value, onChange, placeholder = 'Enter a thought...' }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.interimResults = false;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onChange(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
      setIsSupported(true);
    }
  }, [onChange]);

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 rounded-lg text-sm transition-all"
        style={{
          background: isLight ? 'rgba(255,252,245,0.6)' : 'rgba(255,255,255,0.05)',
          border: isLight ? '1px solid rgba(60,50,35,0.2)' : '1px solid rgba(255,255,255,0.1)',
          color: isLight ? 'var(--light-text-primary)' : 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
        }}
      />

      {isSupported && (
        <button
          onClick={isListening ? stopListening : startListening}
          className="px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: isListening
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : (isLight ? 'rgba(60,50,35,0.08)' : 'rgba(255,255,255,0.08)'),
            border: isListening
              ? '1px solid #dc2626'
              : (isLight ? '1px solid rgba(60,50,35,0.15)' : '1px solid rgba(255,255,255,0.15)'),
            color: isListening ? '#fff' : (isLight ? 'var(--light-text-primary)' : 'var(--text-primary)'),
            boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
          }}
          title={isListening ? 'Stop listening' : 'Speak to enter text'}
        >
          {isListening ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
              Listening...
            </span>
          ) : (
            '🎤 Speak'
          )}
        </button>
      )}
    </div>
  );
}

export default SpeechToTextInput;
