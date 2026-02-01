// src/components/SensoryConfig.jsx
// Cognitive Submode Menu - Awareness Practice Configuration
// Displays Sakshi I & II practice cards with scene selector
import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAwarenessSceneStore } from '../state/awarenessSceneStore.js';

export const SENSORY_TYPES = [
    { id: 'bodyScan', label: 'Body Scan', description: 'Progressive body awareness' },
    { id: 'sakshi', label: 'Sakshi', description: 'Witness consciousness' },
];

// Awareness scene options - paths will be prefixed with BASE_URL at runtime
const AWARENESS_SCENES = [
    { id: 'forest', label: 'Forest', imagePath: 'awareness/scenes/forest.webp' },
    { id: 'street', label: 'Street', imagePath: 'awareness/scenes/street.webp' },
    { id: 'room', label: 'Room', imagePath: 'awareness/scenes/room.webp' },
    { id: 'beach', label: 'Beach', imagePath: 'awareness/scenes/beach.webp' },
    { id: 'mountain', label: 'Mountain', imagePath: 'awareness/scenes/mountain.webp' },
];

export function SensoryConfig({
    sensoryType,
    setSensoryType,
    isLight = false,
    onStart = null,
}) {
    const { selectedScene, setSelectedScene, sakshiVersion, setSakshiVersion } = useAwarenessSceneStore();
    const baseUrl = import.meta.env.BASE_URL;

    return (
        <div className="sensory-config space-y-6">
            {/* Sakshi Practice Cards */}
            <div className="space-y-3">
                {/* Sakshi I - Witnessing Presence */}
                <button
                    onClick={() => setSakshiVersion(1)}
                    className="relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer hover:shadow-lg text-left w-full"
                    style={{
                        background: 'linear-gradient(135deg, rgba(20, 40, 45, 0.8) 0%, rgba(15, 35, 40, 0.9) 100%)',
                        borderColor: sakshiVersion === 1 ? 'rgba(100, 200, 150, 0.8)' : 'rgba(100, 200, 150, 0.3)',
                        borderWidth: sakshiVersion === 1 ? '2px' : '1px',
                        minHeight: '180px',
                        display: 'flex',
                        alignItems: 'stretch',
                        boxShadow: sakshiVersion === 1 ? '0 0 20px rgba(100, 200, 150, 0.4)' : 'none',
                        padding: 0,
                    }}
                >
                    {/* Background image */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${baseUrl}awareness/scenes/forest.webp)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 0.25,
                            zIndex: 0,
                        }}
                    />

                    {/* Content overlay */}
                    <div
                        className="relative z-10 p-6 flex flex-col justify-between flex-1"
                        style={{
                            background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 100%)',
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#D4AF37',
                                    letterSpacing: '1px',
                                    marginBottom: '4px',
                                }}
                            >
                                SAKSHI I
                            </h3>
                            <h4
                                style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: '18px',
                                    color: '#E8DCC8',
                                    fontWeight: 400,
                                    marginBottom: '8px',
                                }}
                            >
                                Witnessing Presence
                            </h4>
                            <p
                                style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: '12px',
                                    color: 'rgba(232, 220, 200, 0.8)',
                                    lineHeight: '1.5',
                                }}
                            >
                                Observe the self as it moves through life.
                                <br />
                                Thoughts arise. Thoughts dissolve.
                                <br />
                                Nothing is kept.
                            </p>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'rgba(232, 220, 200, 0.7)',
                                fontSize: '10px',
                                fontFamily: 'var(--font-display)',
                                letterSpacing: '0.5px',
                            }}
                        >
                            <span>👁️</span>
                            <span>NO RECORDING</span>
                        </div>
                    </div>
                </button>

                {/* Sakshi II - Noticing & Labeling (Reflection/Control Panel) */}
                <button
                    onClick={() => setSakshiVersion(2)}
                    className="relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer hover:shadow-lg text-left w-full"
                    style={{
                        background: 'linear-gradient(135deg, rgba(20, 40, 45, 0.8) 0%, rgba(15, 35, 40, 0.9) 100%)',
                        borderColor: sakshiVersion === 2 ? 'rgba(100, 200, 150, 0.8)' : 'rgba(100, 200, 150, 0.3)',
                        borderWidth: sakshiVersion === 2 ? '2px' : '1px',
                        minHeight: '180px',
                        display: 'flex',
                        alignItems: 'stretch',
                        boxShadow: sakshiVersion === 2 ? '0 0 20px rgba(100, 200, 150, 0.4)' : 'none',
                        padding: 0,
                    }}
                >
                    {/* Background image */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${baseUrl}awareness/menu/sakshi_ii_menu.webp)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 0.25,
                            zIndex: 0,
                        }}
                    />

                    {/* Content overlay */}
                    <div
                        className="relative z-10 p-6 flex flex-col justify-between flex-1"
                        style={{
                            background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 100%)',
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#D4AF37',
                                    letterSpacing: '1px',
                                    marginBottom: '4px',
                                }}
                            >
                                SAKSHI II
                            </h3>
                            <h4
                                style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: '18px',
                                    color: '#E8DCC8',
                                    fontWeight: 400,
                                    marginBottom: '8px',
                                }}
                            >
                                Noticing & Labeling
                            </h4>
                            <p
                                style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: '12px',
                                    color: 'rgba(232, 220, 200, 0.8)',
                                    lineHeight: '1.5',
                                }}
                            >
                                Watch the mind through a reflective lens.
                                <br />
                                Label each thought with clarity.
                                <br />
                                Return to silence.
                            </p>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'rgba(232, 220, 200, 0.7)',
                                fontSize: '10px',
                                fontFamily: 'var(--font-display)',
                                letterSpacing: '0.5px',
                            }}
                        >
                            <span>🪞</span>
                            <span>OBSERVATION</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Scene Selector */}
            <div className="space-y-3">
                <div
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                    }}
                >
                    Scene
                </div>

                {/* Scene thumbnails grid */}
                <div className="grid grid-cols-3 gap-3">
                    {AWARENESS_SCENES.map((scene) => (
                        <button
                            key={scene.id}
                            onClick={() => setSelectedScene(scene.id)}
                            className="relative group rounded-lg overflow-hidden transition-all duration-300"
                            style={{
                                aspectRatio: '4/3',
                                border: selectedScene === scene.id ? '2px solid #64C896' : '1px solid rgba(100, 200, 150, 0.2)',
                                borderRadius: '8px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                padding: 0,
                                cursor: 'pointer',
                                transform: selectedScene === scene.id ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: selectedScene === scene.id ? '0 0 12px rgba(100, 200, 150, 0.4)' : 'none',
                            }}
                        >
                            {/* Background image */}
                            <img
                                src={baseUrl + scene.imagePath}
                                alt={scene.label}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'opacity 300ms',
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
}
