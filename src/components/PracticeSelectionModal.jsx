// src/components/PracticeSelectionModal.jsx
// Modal for selecting practice type - replaces horizontal button row

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function PracticeSelectionModal({
    isOpen,
    onClose,
    practices,
    currentPractice,
    onSelectPractice
}) {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Use Portal to render at document.body level, escaping all stacking contexts
    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{
                zIndex: 99999,  // Maximum z-index
                background: 'rgba(0, 0, 0, 0.85)',  // Darker backdrop
                backdropFilter: 'blur(16px)',  // Stronger blur
                animation: 'fadeIn 200ms ease-out',
            }}
            onClick={onClose}
        >
            <div
                className="relative p-8 rounded-[2rem] max-w-md w-full mx-4 glass-capsule"
                data-card="true"
                data-card-id="modal:practiceSelection"
                style={{
                    animation: 'slideUp 300ms ease-out',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="mb-6 text-center"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: 'rgba(253, 251, 245, 0.4)',
                    }}
                >
                    Select Practice
                </div>

                {/* Practice list */}
                <div className="space-y-2">
                    {practices.map((practice) => {
                        const isSelected = practice === currentPractice;

                        return (
                            <button
                                key={practice}
                                onClick={() => {
                                    onSelectPractice(practice);
                                    onClose();
                                }}
                                className={`w-full px-6 py-4 rounded-full transition-all duration-300 group relative overflow-hidden ${isSelected ? 'glass-capsule' : 'hover:bg-white/5'}`}
                                style={{
                                    border: isSelected
                                        ? '0.5px solid var(--accent-40)'
                                        : '0.5px solid transparent',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '12px',
                                    letterSpacing: 'var(--tracking-mythic)',
                                    color: isSelected
                                        ? 'var(--accent-color)'
                                        : 'rgba(253, 251, 245, 0.5)',
                                    textAlign: 'center',
                                    background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                }}
                            >
                                <span className="relative z-10">{practice}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Close hint */}
                <div
                    className="mt-6 text-center"
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '9px',
                        letterSpacing: 'var(--tracking-wide)',
                        color: 'rgba(253, 251, 245, 0.3)',
                    }}
                >
                    Press ESC or click outside to close
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>,
        document.body
    );
}
