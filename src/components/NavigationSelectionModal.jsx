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
            data-testid="navigation-selection-modal"
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 200ms ease-out',
            }}
            onClick={onClose}
        >
            <div
                className="relative p-8 rounded-[2rem] max-w-md w-full mx-4 glass-capsule"
                style={{
                    animation: 'slideUp 300ms ease-out',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="type-label mb-6 text-center"
                    style={{
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
                                className={`type-label w-full px-6 py-4 rounded-full transition-all duration-300 group relative overflow-hidden ${isSelected ? 'glass-capsule' : 'hover:bg-white/5'}`}
                                style={{
                                    border: isSelected
                                        ? `0.5px solid ${isCompass ? 'rgba(220, 210, 180, 0.4)' : 'var(--accent-40)'}`
                                        : '0.5px solid transparent',
                                    color: isSelected ? goldColor : 'rgba(253, 251, 245, 0.5)',
                                    textAlign: 'center',
                                    background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                }}
                            >
                                <div className="relative z-10">
                                    <div className="type-h3">{option.label}</div>
                                    <div className="type-caption italic opacity-50 mt-0.5">
                                        {option.description}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Close hint */}
                <div
                    className="type-caption mt-6 text-center"
                    style={{
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
