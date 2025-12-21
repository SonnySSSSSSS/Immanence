// src/components/PracticeSelectionModal.jsx
// Modal for selecting practice type - replaces horizontal button row

import React, { useEffect } from 'react';

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

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 200ms ease-out',
            }}
            onClick={onClose}
        >
            <div
                className="relative p-6 rounded-2xl max-w-md w-full mx-4"
                style={{
                    background: 'linear-gradient(180deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
                    border: '1px solid var(--accent-15)',
                    boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 0 80px var(--accent-10)',
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
                                className="w-full px-6 py-4 rounded-xl transition-all duration-200"
                                style={{
                                    background: isSelected
                                        ? 'linear-gradient(135deg, var(--accent-10) 0%, transparent 100%)'
                                        : 'rgba(253, 251, 245, 0.02)',
                                    border: isSelected
                                        ? '1px solid var(--accent-20)'
                                        : '1px solid rgba(253, 251, 245, 0.05)',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    letterSpacing: 'var(--tracking-wide)',
                                    color: isSelected
                                        ? 'var(--accent-color)'
                                        : 'rgba(253, 251, 245, 0.7)',
                                    boxShadow: isSelected
                                        ? '0 0 20px var(--accent-08), inset 0 0 20px var(--accent-05)'
                                        : 'none',
                                    textAlign: 'left',
                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                {practice}
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
        </div>
    );
}
