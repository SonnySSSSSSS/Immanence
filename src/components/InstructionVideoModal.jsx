import React from 'react';

export function InstructionVideoModal({ isOpen, title, videoUrl, onClose }) {
    if (!isOpen || !videoUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[10010] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Instruction Video'}
        >
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            <div
                className="relative z-[1] w-full max-w-4xl overflow-hidden rounded-[24px] border shadow-2xl"
                style={{
                    background: 'rgba(10, 10, 15, 0.96)',
                    borderColor: 'rgba(255,255,255,0.12)',
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between gap-4 px-5 py-4 border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    <div
                        className="type-label"
                        style={{
                            color: 'rgba(255,255,255,0.92)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {title || 'Instruction Video'}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full px-3 py-1 text-xs uppercase"
                        style={{
                            border: '1px solid rgba(255,255,255,0.14)',
                            color: 'rgba(255,255,255,0.88)',
                            background: 'rgba(255,255,255,0.06)',
                        }}
                    >
                        Close
                    </button>
                </div>

                <div className="p-4">
                    <video
                        controls
                        playsInline
                        preload="metadata"
                        style={{
                            width: '100%',
                            display: 'block',
                            borderRadius: 16,
                            background: '#000',
                            maxHeight: 'min(72vh, 720px)',
                        }}
                    >
                        <source src={videoUrl} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    );
}

export default InstructionVideoModal;
