// src/components/FeedbackModal.jsx
// Post-evening practice feedback capture for pilot testing
import React, { useState } from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function FeedbackModal({ isOpen, onClose, onSubmit }) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  const [rating, setRating] = useState(null);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!rating) {
      alert('Please select a rating');
      return;
    }

    // Save to localStorage
    const feedback = {
      timestamp: new Date().toISOString(),
      rating,
      note: note.trim(),
      sessionType: 'evening',
    };

    // Get existing feedback
    const existing = JSON.parse(localStorage.getItem('immanenceOS.pilotFeedback') || '[]');
    existing.push(feedback);
    localStorage.setItem('immanenceOS.pilotFeedback', JSON.stringify(existing));

    onSubmit?.(feedback);
    onClose();
    
    // Reset form
    setRating(null);
    setNote('');
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl border p-6"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, #faf6ee 0%, #f5efe5 100%)'
            : 'linear-gradient(135deg, rgb(26, 15, 28) 0%, rgb(21, 11, 22) 100%)',
          borderColor: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-20)',
          boxShadow: isLight
            ? '0 20px 60px rgba(0, 0, 0, 0.15)'
            : '0 20px 60px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 
            className="text-xl font-bold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: isLight ? '#3c3020' : '#fdfbf5',
            }}
          >
            How did this feel?
          </h2>
          <p 
            className="text-sm opacity-70"
            style={{
              fontFamily: 'var(--font-body)',
              color: isLight ? '#3c3020' : '#fdfbf5',
            }}
          >
            Evening practice complete
          </p>
        </div>

        {/* Rating Buttons */}
        <div className="flex gap-3 mb-4">
          {[
            { value: 'good', label: 'Good', emoji: '😊' },
            { value: 'neutral', label: 'Neutral', emoji: '😐' },
            { value: 'bad', label: 'Bad', emoji: '😔' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setRating(option.value)}
              className="flex-1 px-4 py-3 rounded-lg font-bold text-sm transition-all"
              style={{
                background: rating === option.value
                  ? 'var(--accent-color)'
                  : (isLight ? 'rgba(60, 50, 35, 0.08)' : 'rgba(255, 255, 255, 0.08)'),
                border: rating === option.value
                  ? '2px solid var(--accent-color)'
                  : (isLight ? '1px solid rgba(60, 50, 35, 0.15)' : '1px solid rgba(255, 255, 255, 0.15)'),
                color: rating === option.value 
                  ? '#fff'
                  : (isLight ? '#3c3020' : '#fdfbf5'),
                fontFamily: 'var(--font-display)',
              }}
            >
              <div className="text-2xl mb-1">{option.emoji}</div>
              <div className="text-xs">{option.label}</div>
            </button>
          ))}
        </div>

        {/* Optional Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional: Add a note..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg text-sm mb-4 resize-none"
          style={{
            background: isLight 
              ? 'rgba(255, 255, 255, 0.5)'
              : 'rgba(0, 0, 0, 0.3)',
            border: isLight 
              ? '1px solid rgba(60, 50, 35, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            color: isLight ? '#3c3020' : '#fdfbf5',
            fontFamily: 'var(--font-body)',
          }}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: isLight 
                ? 'rgba(60, 50, 35, 0.08)'
                : 'rgba(255, 255, 255, 0.08)',
              border: isLight 
                ? '1px solid rgba(60, 50, 35, 0.15)'
                : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#3c3020' : '#fdfbf5',
              fontFamily: 'var(--font-display)',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!rating}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: rating
                ? 'var(--accent-color)'
                : (isLight ? 'rgba(60, 50, 35, 0.2)' : 'rgba(255, 255, 255, 0.2)'),
              color: '#fff',
              fontFamily: 'var(--font-display)',
              opacity: rating ? 1 : 0.5,
              cursor: rating ? 'pointer' : 'not-allowed',
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
