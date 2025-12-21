// src/components/WelcomeScreen.jsx
import React, { useState } from 'react';
import { PillButton } from './ui/PillButton';

export function WelcomeScreen({ onDismiss }) {
    const [layer, setLayer] = useState(1);

    const handleEnter = () => {
        onDismiss();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg"
            style={{ animation: 'fadeIn 600ms ease-out' }}
        >
            <div
                className="max-w-2xl mx-auto px-8 py-12 relative"
                style={{ animation: 'slideUp 800ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
                {/* Decorative corner flourishes */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 opacity-40" style={{ borderColor: 'var(--accent-color)' }} />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 opacity-40" style={{ borderColor: 'var(--accent-color)' }} />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 opacity-40" style={{ borderColor: 'var(--accent-color)' }} />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 opacity-40" style={{ borderColor: 'var(--accent-color)' }} />

                {/* Content */}
                <div className="relative z-10">
                    {layer === 1 ? (
                        <div
                            className="space-y-8 text-center"
                            style={{ animation: 'fadeIn 400ms ease-out' }}
                        >
                            {/* Layer 1 - The Hook */}
                            <div className="space-y-6">
                                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.7)' }}>
                                    Most meditation apps calm you down.
                                </p>

                                <p className="text-[17px] leading-relaxed font-medium" style={{ color: 'rgba(253,251,245,0.95)' }}>
                                    Immanence OS rewires the subconscious patterns that decide what you feel, what you think, and who you ultimately become.
                                </p>

                                <p
                                    className="text-[22px] font-semibold tracking-wide"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 600,
                                        letterSpacing: 'var(--tracking-mythic)',
                                        color: 'var(--accent-color)',
                                        textShadow: '0 0 20px var(--accent-20)'
                                    }}
                                >
                                    This is a dojo, not a spa.
                                </p>

                                <div className="w-24 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.7)' }}>
                                    That's it.
                                </p>

                                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.7)' }}>
                                    No karma, no dharma, no past lives.
                                </p>

                                <p className="text-[16px] leading-relaxed font-medium" style={{ color: 'rgba(253,251,245,0.9)' }}>
                                    Just the promise of actual power over the invisible machinery that runs your life.
                                </p>
                            </div>

                            {/* Buttons - Layer 1 */}
                            <div className="flex gap-4 justify-center pt-8">
                                <PillButton
                                    onClick={() => setLayer(2)}
                                    variant="secondary"
                                    size="md"
                                >
                                    Tell Me More
                                </PillButton>

                                <PillButton
                                    onClick={handleEnter}
                                    variant="primary"
                                    size="md"
                                >
                                    Enter
                                </PillButton>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="space-y-8 text-center"
                            style={{ animation: 'fadeIn 400ms ease-out' }}
                        >
                            {/* Layer 2 - The Philosophy */}
                            <div className="space-y-5 max-h-[70vh] overflow-y-auto px-4 custom-scrollbar">
                                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.8)' }}>
                                    Do you know the saying <span style={{ color: 'var(--accent-color)' }}>"Beware your thoughts → actions → character → destiny"</span>?
                                </p>

                                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.8)' }}>
                                    Eastern traditions add one missing line:
                                </p>

                                <p className="text-[16px] leading-relaxed font-medium" style={{ color: 'rgba(253,251,245,0.95)' }}>
                                    Beware your feelings, because they decide which thoughts are even available to you.
                                </p>

                                <div className="w-32 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.8)' }}>
                                    Your feelings are your karma — the invisible grooves you fall into without noticing.
                                </p>

                                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.8)' }}>
                                    Most people never realize those grooves can be rewritten while you're still alive.
                                </p>

                                <div className="w-32 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                                <p className="text-[15px] leading-relaxed italic" style={{ color: 'rgba(253,251,245,0.85)', fontFamily: 'var(--font-body)' }}>
                                    Immanence OS is the dojo I built for myself after twenty years of practice — a complete, modern system that fuses the deepest principles of science, mythology, and direct experience into daily, progressive training of mind, body, and spirit.
                                </p>

                                <p className="text-[16px] leading-relaxed font-medium" style={{ color: 'rgba(253,251,245,0.95)' }}>
                                    Here you don't just meditate.
                                </p>

                                <p className="text-[16px] leading-relaxed font-medium" style={{ color: 'rgba(253,251,245,0.95)' }}>
                                    You deliberately break karmic loops and align with the life you actually choose — your dharma.
                                </p>

                                <div className="w-32 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--accent-40), transparent)' }} />

                                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.7)' }}>
                                    This is not for everyone.
                                </p>

                                <p className="text-[16px] leading-relaxed font-semibold" style={{ color: 'var(--accent-color)' }}>
                                    It's for the few who are done managing symptoms and ready to upgrade the operating system.
                                </p>
                            </div>

                            {/* Button - Layer 2 */}
                            <div className="flex justify-center pt-8">
                                <PillButton
                                    onClick={handleEnter}
                                    variant="primary"
                                    size="lg"
                                    style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--tracking-mythic)' }}
                                >
                                    Enter
                                </PillButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--accent-30);
          border-radius: 3px;
        }
      `}</style>
        </div>
    );
}

