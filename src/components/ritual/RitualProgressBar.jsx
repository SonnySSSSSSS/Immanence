import React from 'react';

const BASE = import.meta.env.BASE_URL || '/';

const STEP_ICONS = [
    `${BASE}assets/ritual/incense_icon_v1.png`,
    `${BASE}assets/ritual/map_icon_v1.png`,
    `${BASE}assets/ritual/orb_hold_icon_v1.png`,
    `${BASE}assets/ritual/random_step_icon_v1.png`,
    `${BASE}assets/ritual/camera_step_icon_v1.png`,
    `${BASE}assets/ritual/quill_icon_v1.png`,
    `${BASE}assets/ritual/glow_frame_5.png`,
];

export function RitualProgressBar({ currentStep }) {
    return (
        <div className="flex items-center justify-center gap-4 py-6">
            {STEP_ICONS.map((icon, index) => {
                const stepIdx = index + 1;
                const isActive = stepIdx === currentStep;
                const isCompleted = stepIdx < currentStep;

                return (
                    <div key={index} className="flex items-center">
                        <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                isActive 
                                    ? 'ring-2 ring-gold scale-110 shadow-[0_0_15px_rgba(212,184,122,0.8)]' 
                                    : isCompleted 
                                        ? 'opacity-80 scale-90' 
                                        : 'opacity-30 grayscale'
                            }`}
                            style={{
                                backgroundImage: `url(${icon})`,
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                            }}
                        />
                        {index < STEP_ICONS.length - 1 && (
                            <div className={`w-8 h-[1px] mx-1 transition-all duration-500 ${
                                isCompleted ? 'bg-gold opacity-60' : 'bg-white/10'
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
