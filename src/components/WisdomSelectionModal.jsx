// src/components/WisdomSelectionModal.jsx
// Modal for selecting Wisdom section: Recommendations, Treatise, Bookmarks, Videos

import React, { useEffect } from 'react';

const TABS = ["Recommendations", "Treatise", "Bookmarks", "Videos", "Self-Knowledge"];

export function WisdomSelectionModal({
    isOpen,
    onClose,
    currentTab,
    onSelectTab,
    bookmarksCount = 0
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
                className="relative p-8 rounded-[2rem] max-w-md w-full mx-4 glass-capsule"
                data-card="true"
                data-card-id="modal:wisdomSelection"
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
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: 'rgba(253, 251, 245, 0.4)',
                    }}
                >
                    Wisdom
                </div>

                {/* Tab list */}
                <div className="space-y-2">
                    {TABS.map((tab) => {
                        const isSelected = tab === currentTab;
                        const countLabel = tab === "Bookmarks" && bookmarksCount > 0 ? ` (${bookmarksCount})` : "";

                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    onSelectTab(tab);
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
                                {isSelected && (
                                    <div className="absolute inset-0 bg-radial-gradient from-[var(--accent-10)] to-transparent opacity-50" />
                                )}
                                <span className="relative z-10">{tab}{countLabel}</span>
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
