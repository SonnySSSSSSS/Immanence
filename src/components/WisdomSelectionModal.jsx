// src/components/WisdomSelectionModal.jsx
// Modal for selecting Wisdom section: Recommendations, Treatise, Bookmarks, Videos

import React, { useEffect } from 'react';

const TABS = ["Recommendations", "Treatise", "Bookmarks", "Videos"];

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
                        fontFamily: 'Georgia, serif',
                        fontSize: '11px',
                        letterSpacing: '0.3em',
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
                                className="w-full px-6 py-4 rounded-xl transition-all duration-200"
                                style={{
                                    background: isSelected
                                        ? 'linear-gradient(135deg, var(--accent-10) 0%, transparent 100%)'
                                        : 'rgba(253, 251, 245, 0.02)',
                                    border: isSelected
                                        ? '1px solid var(--accent-20)'
                                        : '1px solid rgba(253, 251, 245, 0.05)',
                                    fontFamily: 'Georgia, serif',
                                    fontSize: '14px',
                                    letterSpacing: '0.08em',
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
                                {tab}{countLabel}
                            </button>
                        );
                    })}
                </div>

                {/* Close hint */}
                <div
                    className="mt-6 text-center"
                    style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '9px',
                        letterSpacing: '0.2em',
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
