import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore';

const CATEGORIES = [
    { id: 'pull', label: 'PULL', icon: '🧲', color: '#60A5FA' },
    { id: 'push', label: 'PUSH', icon: '🛡️', color: '#F87171' },
    { id: 'story', label: 'STORY', icon: '📖', color: '#FBBF24' },
    { id: 'static', label: 'STATIC', icon: '🌫️', color: '#9CA3AF' },
];

export function HomeSnowVipassana({ onExit }) {
    const { mode } = useDisplayModeStore();
    const isHearth = mode === 'hearth';
    const assetsPrefix = import.meta.env.BASE_URL + 'assets/';
    
    const [thoughts, setThoughts] = useState([]);
    const [activeThought, setActiveThought] = useState(null);
    const lastSpawnTime = useRef(0);
    const animationFrameRef = useRef(null);

    // Asset paths - using stylized versions
    const assets = {
        frame: assetsPrefix + (isHearth ? 'homeSnow_hearth_stylized_frame.png' : 'homeSnow_sanctuary_stylized_frame.png'),
        bg: assetsPrefix + (isHearth ? 'homeSnow_hearth_stylized_bg.png' : 'homeSnow_sanctuary_stylized_bg.png'),
        mid: assetsPrefix + (isHearth ? 'homeSnow_hearth_stylized_mid.png' : 'homeSnow_sanctuary_stylized_mid.png'),
        fg: assetsPrefix + (isHearth ? 'homeSnow_hearth_stylized_fg.png' : 'homeSnow_sanctuary_stylized_fg.png'),
        thoughtPack: assetsPrefix + 'thoughtObjects_homeSnow_stylized_pack.png',
    };

    // Parallax logic - Horizontal
    const [offsets, setOffsets] = useState({ bg: 0, mid: 0, fg: 0 });

    const spawnThought = useCallback(() => {
        const id = Date.now();
        const fromLeft = Math.random() > 0.5;
        const newThought = {
            id,
            x: fromLeft ? -5 : 105,
            y: 40 + Math.random() * 20, // Midground vertical zone
            vx: fromLeft ? (0.05 + Math.random() * 0.1) : -(0.05 + Math.random() * 0.1),
            scale: 0.6 + Math.random() * 0.4,
            variant: Math.floor(Math.random() * 4), // 4 categories
        };
        setThoughts(prev => [...prev, newThought]);
        lastSpawnTime.current = id;
    }, []);

    useEffect(() => {
        let startTime = performance.now();
        const animate = (time) => {
            const elapsed = (time - startTime) / 1000;
            
            // Horizontal speeds: BG 0.2x, MID 0.5x, FG 1.0x
            // We use a modular loop based on image width (860px for hearth)
            const width = isHearth ? 860 : 1640; // Double the viewport width
            setOffsets({
                bg: (elapsed * 15) % (width / 2),
                mid: (elapsed * 40) % (width / 2),
                fg: (elapsed * 80) % (width / 2),
            });

            // Thought movement - Drifting across MIDGROUND (center zone)
            setThoughts(prev => prev.map(t => ({
                ...t,
                x: t.x + t.vx,
                y: t.y + (Math.sin(elapsed * 2 + t.id) * 0.05), // Subtle sway
            })).filter(t => t.x < 110 && t.x > -10));

            // Auto-spawn in MIDGROUND zone
            if (activeThought === null && Date.now() - lastSpawnTime.current > 4000 && Math.random() < 0.03) {
                spawnThought();
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [activeThought, isHearth, spawnThought]);

    const handleTag = (categoryId) => {
        if (!activeThought) return;
        setThoughts(prev => prev.map(t => 
            t.id === activeThought.id ? { ...t, tagged: true, categoryId } : t
        ));
        setTimeout(() => {
            setThoughts(prev => prev.filter(t => t.id !== activeThought.id));
            setActiveThought(null);
        }, 800);
    };

    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center z-50">
            {/* Parallax Container */}
            <div className={`relative ${isHearth ? 'w-[430px]' : 'w-[820px]'} h-full overflow-hidden`}>
                
                {/* Background Layer (Top Third) */}
                <div className="absolute inset-0 pointer-events-none" style={{ clipPath: 'inset(0 0 66% 0)' }}>
                    <div 
                        className="absolute inset-0 bg-repeat-x bg-contain"
                        style={{ 
                            backgroundImage: `url(${assets.bg})`,
                            transform: `translateX(-${offsets.bg}px)`,
                            width: '200%'
                        }}
                    />
                </div>

                {/* Midground Layer (Center Zone) */}
                <div className="absolute inset-0 pointer-events-none" style={{ clipPath: 'inset(33% 0 33% 0)' }}>
                    <div 
                        className="absolute inset-0 bg-repeat-x bg-contain"
                        style={{ 
                            backgroundImage: `url(${assets.mid})`,
                            transform: `translateX(-${offsets.mid}px)`,
                            width: '200%' 
                        }}
                    />
                </div>

                {/* Thought Objects (In Midground Zone) */}
                <div className="absolute inset-0 pointer-events-none">
                    {thoughts.map(t => (
                        <div 
                            key={t.id}
                            className={`absolute w-16 h-16 cursor-pointer pointer-events-auto transition-all duration-500 ${activeThought?.id === t.id ? 'scale-125' : ''}`}
                            style={{ 
                                left: `${t.x}%`, 
                                top: `${t.y}%`, 
                                transform: `scale(${t.scale})`,
                                opacity: t.tagged ? 0 : 0.8,
                                backgroundImage: `url(${assets.thoughtPack})`,
                                backgroundSize: '400% 100%',
                                backgroundPosition: `${(t.variant * 100) / 3}% center`,
                                filter: t.tagged ? 'brightness(2) blur(2px)' : 'none',
                                animation: 'float 4s ease-in-out infinite'
                            }}
                            onClick={() => setActiveThought(t)}
                        />
                    ))}
                </div>

                {/* Foreground Layer (Bottom Third) */}
                <div className="absolute inset-0 pointer-events-none" style={{ clipPath: 'inset(66% 0 0 0)' }}>
                    <div 
                        className="absolute inset-0 bg-repeat-x bg-contain"
                        style={{ 
                            backgroundImage: `url(${assets.fg})`,
                            transform: `translateX(-${offsets.fg}px)`,
                            width: '200%'
                        }}
                    />
                </div>

                {/* Window Frame (Top Layer) */}
                <div 
                    className="absolute inset-0 bg-cover bg-center pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${assets.frame})`,
                        mixBlendMode: 'normal'
                    }}
                />
            </div>

            {/* Tagging Panel */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-[60]">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => handleTag(cat.id)}
                        disabled={!activeThought}
                        className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all
                            ${activeThought ? 'opacity-100 scale-100' : 'opacity-20 scale-90 pointer-events-none'}
                            border border-white/10 bg-white/5 backdrop-blur-sm
                        `}
                    >
                        <span className="text-[9px] font-bold tracking-widest text-white/60">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Exit Button */}
            <button 
                onClick={onExit}
                className="absolute top-8 right-8 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-all z-[60]"
            >
                ✕
            </button>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    );
}

export default HomeSnowVipassana;
