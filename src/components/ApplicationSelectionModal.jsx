// src/components/ApplicationSelectionModal.jsx
// Modal for selecting between Tracking and Four Modes

import React, { useEffect } from 'react';

export function ApplicationSelectionModal({
    isOpen,
    onClose,
    currentView, // 'tracking' or 'modes'
    onSelectView
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

    const options = [
        { id: 'tracking', label: 'Tracking', description: 'Track moments of awareness in daily life' },
        { id: 'modes', label: 'Four Modes', description: 'Explore the four archetypal modes' }
    ];

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
                    border: '1px solid var(--gold-30)',
                    boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 0 80px rgba(251, 191, 36, 0.1)',
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
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: 'rgba(253, 251, 245, 0.4)',
                    }}
                >
                    Application
                </div>

                {/* Options */}
                <div className="space-y-2">
                    {options.map((option) => {
                        const isSelected = option.id === currentView;
                        const isModes = option.id === 'modes';
                        const goldShadow = isSelected
                            ? (isModes
                                ? '0 0 20px rgba(202, 138, 4, 0.15), inset 0 0 20px rgba(202, 138, 4, 0.08)'
                                : '0 0 20px rgba(251, 191, 36, 0.15), inset 0 0 20px rgba(251, 191, 36, 0.08)')
                            : 'none';

                        return (
                            <button
                                key={option.id}
                                onClick={() => {
                                    onSelectView(option.id);
                                    onClose();
                                }}
                                className="w-full px-6 py-4 rounded-xl transition-all duration-200"
                                style={{
                                    background: isSelected
                                        ? 'linear-gradient(135deg, var(--gold-10) 0%, transparent 100%)'
                                        : 'rgba(253, 251, 245, 0.02)',
                                    border: isSelected
                                        ? '1px solid var(--gold-30)'
                                        : '1px solid rgba(253, 251, 245, 0.05)',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    letterSpacing: 'var(--tracking-wide)',
                                    color: isSelected ? 'var(--gold-100)' : 'rgba(253, 251, 245, 0.7)',
                                    boxShadow: goldShadow,
                                    textAlign: 'left',
                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                <div>{option.label}</div>
                                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', fontStyle: 'italic', fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}>
                                    {option.description}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Close hint */}
                <div
                    className="mt-6 text-center"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
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
