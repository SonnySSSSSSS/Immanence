// src/components/Cycle/OrbitalSequence.jsx
// Orbital/radial layout for circuit exercises
import { motion } from 'framer-motion';

void motion;

export function OrbitalSequence({ selectedExercises, onRemove }) {
    if (selectedExercises.length === 0) return null;

    return (
        <div>
            <div
                className="text-xs text-white/40 mb-4 uppercase tracking-[0.15em] text-center font-bold"
                style={{ fontFamily: 'var(--font-body)' }}
            >
                Circuit Sequence · {selectedExercises.length} Paths
            </div>

            {/* Orbital Container */}
            <div className="relative flex items-center justify-center" style={{ height: '320px' }}>
                {/* Center Core */}
                <div
                    className="absolute rounded-full flex items-center justify-center z-10"
                    style={{
                        width: '80px',
                        height: '80px',
                        background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1)',
                        border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: 'inset 0 0 20px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.2)',
                    }}
                >
                    <div className="text-center">
                        <div
                            className="text-2xl font-bold tracking-wide"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-color)' }}
                        >
                            {selectedExercises.length}
                        </div>
                        <div
                            className="text-[8px] uppercase tracking-wider font-bold"
                            style={{ fontFamily: 'var(--font-body)', color: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.6)' }}
                        >
                            Paths
                        </div>
                    </div>
                </div>

                {/* Orbital Exercises */}
                {selectedExercises.map((item, index) => {
                    const angle = (index / selectedExercises.length) * 360 - 90;
                    const rad = (angle * Math.PI) / 180;
                    const radius = 120;
                    const x = Math.cos(rad) * radius;
                    const y = Math.sin(rad) * radius;

                    return (
                        <motion.div
                            key={item.exercise.id}
                            className="absolute"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                        >
                            {/* Connection Line to Center */}
                            <div
                                className="absolute"
                                style={{
                                    width: '1px',
                                    height: `${radius - 40}px`,
                                    background: 'linear-gradient(to bottom, hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3), transparent)',
                                    left: '50%',
                                    bottom: '100%',
                                    transform: `translateX(-50%) rotate(${-angle + 90}deg)`,
                                    transformOrigin: 'bottom',
                                }}
                            />

                            {/* Exercise Card */}
                            <div
                                className="rounded-full p-4 relative"
                                style={{
                                    background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.12)',
                                    border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3)',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: `0 0 20px ${item.exercise.glow}`,
                                    width: '70px',
                                    height: '70px',
                                }}
                            >
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div
                                        className="text-2xl mb-1"
                                        style={{
                                            filter: `drop-shadow(0 0 6px ${item.exercise.glow})`,
                                        }}
                                    >
                                        {item.exercise.icon}
                                    </div>

                                    {/* Duration Badge */}
                                    <div
                                        className="absolute -bottom-2 px-2 py-0.5 rounded-full text-[9px]"
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.9)',
                                            color: '#000',
                                            fontWeight: '700',
                                        }}
                                    >
                                        {item.duration}m
                                    </div>

                                    {/* Sequence Number */}
                                    <div
                                        className="absolute -top-2 -right-2 rounded-full text-[10px] flex items-center justify-center"
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            background: 'var(--accent-color)',
                                            color: '#000',
                                            width: '18px',
                                            height: '18px',
                                            fontWeight: '900',
                                        }}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => onRemove(item.exercise)}
                                        className="absolute -top-2 -left-2 rounded-full text-xs flex items-center justify-center transition-colors"
                                        style={{
                                            background: 'rgba(0,0,0,0.8)',
                                            color: 'rgba(255,255,255,0.5)',
                                            width: '18px',
                                            height: '18px',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Exercise Name Tooltip */}
                            <div
                                className="absolute top-full mt-2 text-[10px] text-white/60 text-center whitespace-nowrap font-medium"
                                style={{ fontFamily: 'var(--font-body)', left: '50%', transform: 'translateX(-50%)' }}
                            >
                                {item.exercise.name}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Instructions */}
            <div
                className="text-center mt-4 text-[10px] text-white/30 font-medium"
                style={{ fontFamily: 'var(--font-body)' }}
            >
                Tap × to remove · Exercises run clockwise from top
            </div>
        </div>
    );
}
