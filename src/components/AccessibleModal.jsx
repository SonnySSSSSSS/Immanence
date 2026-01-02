// src/components/AccessibleModal.jsx
// Phase 5: Accessible modal with ARIA labels, keyboard nav, focus management

import React, { useEffect, useRef } from 'react';

export function AccessibleModal({ isOpen, onClose, title, children, ariaLabel }) {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        // Store previously focused element
        previousActiveElement.current = document.activeElement;

        // Focus modal
        if (modalRef.current) {
            modalRef.current.focus();
        }

        // Handle Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';

            // Restore focus
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            role="presentation"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                aria-label={ariaLabel}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    outline: 'none'
                }}
            >
                {title && <div id="modal-title" style={{ display: 'none' }}>{title}</div>}
                {children}
            </div>
        </div>
    );
}

export default AccessibleModal;