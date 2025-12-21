// src/components/NavigationSelectionModal.jsx
// Modal for selecting between Paths and Compass navigation views

import React, { useEffect } from 'react';

export function NavigationSelectionModal({
    isOpen,
    onClose,
    currentView, // 'paths' or 'compass'
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
        { id: 'paths', label: '◇ Paths', description: 'Choose direction. Progress deliberately.' },
        { id: 'compass', label: '◈ Compass', description: 'Restore agency. Do not advance.' }
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
                    border: '1px solid rgba(250, 208, 120, 0.2)',
                    boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 0 80px rgba(250, 208, 120, 0.1)',
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
                    Navigation
                </div>

                {/* Options */}
                <div className="space-y-2">
                    {options.map((option) => {
                        const isSelected = option.id === currentView;
                        const isCompass = option.id === 'compass';
                        const goldColor = isCompass ? 'rgba(220, 210, 180, 1)' : '#F5D18A';

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
                                        ? `linear-gradient(135deg, ${isCompass ? 'rgba(220, 210, 180, 0.1)' : 'rgba(250, 208, 120, 0.1)'} 0%, transparent 100%)`
                                        : 'rgba(253, 251, 245, 0.02)',
                                    border: isSelected
                                        ? `1px solid ${isCompass ? 'rgba(220, 210, 180, 0.4)' : 'rgba(250, 208, 120, 0.4)'}`
                                        : '1px solid rgba(253, 251, 245, 0.05)',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    letterSpacing: 'var(--tracking-wide)',
                                    color: isSelected ? goldColor : 'rgba(253, 251, 245, 0.7)',
                                    boxShadow: isSelected
                                        ? `0 0 20px ${isCompass ? 'rgba(220, 210, 180, 0.15)' : 'rgba(250, 208, 120, 0.15)'}, inset 0 0 20px ${isCompass ? 'rgba(220, 210, 180, 0.08)' : 'rgba(250, 208, 120, 0.08)'}`
                                        : 'none',
                                    textAlign: 'left',
                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                <div>{option.label}</div>
                                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', fontStyle: 'italic' }}>
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
