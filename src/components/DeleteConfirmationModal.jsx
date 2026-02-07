// src/components/DeleteConfirmationModal.jsx
// Phase 4: Safe deletion with confirmation

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore';
import { AccessibleModal } from './AccessibleModal';

export function DeleteConfirmationModal({ message, onConfirm, onCancel }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';

    return (
        <AccessibleModal
            isOpen={true}
            onClose={onCancel}
            title="Confirm Deletion"
            ariaLabel="Confirm deletion of journal entry"
        >
            <div style={{
                backgroundColor: bgColor,
                color: textColor,
                borderRadius: '16px',
                maxWidth: '400px',
                width: '100%',
                border: `1px solid ${borderColor}`
            }}>
                {/* Message */}
                <div style={{ padding: '20px' }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', opacity: 0.8 }}>
                        {message || 'Are you sure you want to delete this entry? This action cannot be undone.'}
                    </p>
                </div>

                {/* Buttons */}
                <div style={{
                    padding: '16px',
                    borderTop: `1px solid ${borderColor}`,
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button onClick={onCancel} style={{
                        padding: '10px 20px',
                        backgroundColor: 'rgba(100, 100, 100, 0.3)',
                        border: 'none',
                        borderRadius: '6px',
                        color: textColor,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={{
                        padding: '10px 20px',
                        backgroundColor: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        Delete
                    </button>
                </div>
            </div>
        </AccessibleModal>
    );
}

export default DeleteConfirmationModal;
