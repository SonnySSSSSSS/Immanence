import React, { useState, useEffect, useRef, useCallback } from 'react';

const CATEGORIES = [
    { id: 'pull', label: 'PULL', icon: '🧲', color: '#60A5FA' },
    { id: 'push', label: 'PUSH', icon: '🛡️', color: '#F87171' },
    { id: 'story', label: 'STORY', icon: '📖', color: '#FBBF24' },
    { id: 'static', label: 'STATIC', icon: '🌫️', color: '#9CA3AF' },
];

export function InsightMeditationPortal({ onExit }) {
    const assetsPrefix = import.meta.env.BASE_URL + 'assets/';
    
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
    const [thoughts, setThoughts] = useState([]);
    const [activeThought, setActiveThought] = useState(null);
    const lastSpawnTime = useRef(0);
    const animationFrameRef = useRef(null);

    // Orientation checking
    useEffect(() => {
        const handleResize = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Asset paths - Mandated Widescreen Assets
    const assets = {
        frame: assetsPrefix + 'insight_portal_frame.png',
        bg: assetsPrefix + 'insight_portal_bg.png',
        // We reuse previous packs but adapt placement
        thoughtPack: assetsPrefix + 'thoughtObjects_homeSnow_stylized_pack.png',
    };

    // Parallax logic - Horizontal (Mandated)
    const [offsets, setOffsets] = useState({ bg: 0, mid: 0, fg: 0 });

    const spawnThought = useCallback(() => {
        const id = Date.now();
        const fromLeft = Math.random() > 0.5;
        const newThought = {
            id,
            x: fromLeft ? -5 : 105,
            y: 35 + Math.random() * 30, // Centered vertically in window
            vx: fromLeft ? (0.04 + Math.random() * 0.08) : -(0.04 + Math.random() * 0.08),
            scale: 0.5 + Math.random() * 0.5,
            variant: Math.floor(Math.random() * 4),
        };
        setThoughts(prev => [...prev, newThought]);
        lastSpawnTime.current = id;
    }, []);

    useEffect(() => {
        if (isPortrait) return;
        let startTime = performance.now();
        const animate = (time) => {
            const elapsed = (time - startTime) / 1000;
            
            // Panoramic speeds
            setOffsets({
                bg: (elapsed * 12) % 1000,
                mid: (elapsed * 30) % 1000,
                fg: (elapsed * 60) % 1000,
            });

            // Thought movement
            setThoughts(prev => prev.map(t => ({
                ...t,
                x: t.x + t.vx,
                y: t.y + (Math.sin(elapsed * 2 + t.id) * 0.05),
            })).filter(t => t.x < 110 && t.x > -10));

            if (activeThought === null && Date.now() - lastSpawnTime.current > 4000 && Math.random() < 0.03) {
                spawnThought();
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [activeThought, isPortrait, spawnThought]);

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

    if (isPortrait) {
        return (
            <div className="fixed inset-0 bg-[#0e1612] z-[100] flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden">
                <div 
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{
                        backgroundImage: `url(${assetsPrefix}insight_failure_mode.png)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.15
                    }}
                />
                
                <h1 className="text-2xl font-bold mb-8 opacity-80 z-10" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
                    Rotate to enter<br/>Portal
                </h1>
                
                <div className="relative w-36 h-36 mb-12 flex items-center justify-center z-10">
                    <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse" />
                    <svg viewBox="0 0 100 100" className="w-20 h-20 opacity-40 animate-spin-slow" style={{ animationDuration: '8s' }}>
                        <path d="M20 50 A30 30 0 1 1 80 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5"/>
                    </svg>
                    <div className="absolute transition-transform duration-500 hover:rotate-90">
                        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="2" width="56" height="36" rx="4" stroke="currentColor" strokeWidth="3"/>
                            <circle cx="50" cy="20" r="1.5" fill="currentColor"/>
                        </svg>
                    </div>
                </div>

                <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 mb-12 max-w-[280px] z-10">
                    Landscape Orientation Required<br/>for Insight Meditation
                </p>

                <div className="flex flex-col gap-4 z-10">
                    <button 
                      onClick={() => setIsPortrait(false)} // DEV/FORCE: allow entering failure mode
                      className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                    >
                        Degrade to Static View
                    </button>
                    <button 
                      onClick={onExit}
                      className="px-10 py-4 rounded-full font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                      style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          fontSize: '10px'
                      }}
                    >
                        Cancel Practice
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center z-[100]">
            {/* Main Portal Shell - Widescreen Focus */}
            <div className="relative w-full h-full max-w-[1920px] aspect-video overflow-hidden shadow-2xl">
                
                {/* Background (Forest) */}
                <div className="absolute inset-0">
                    <div 
                        className="absolute inset-0 bg-repeat-x bg-cover"
                        style={{ 
                            backgroundImage: `url(${assets.bg})`,
                            backgroundPosition: 'center',
                            transform: `translateX(-${offsets.bg * 0.1}px) scale(1.1)`,
                        }}
                    />
                </div>

                {/* Parallax Mid (Trees/Snow) */}
                <div className="absolute inset-0 pointer-events-none opacity-60">
                     <div 
                        className="absolute inset-0 bg-repeat-x bg-contain"
                        style={{ 
                            backgroundImage: `url(${assetsPrefix}homeSnow_sanctuary_stylized_mid.png)`,
                            transform: `translateX(-${offsets.mid}px)`,
                            width: '300%'
                        }}
                    />
                </div>

                {/* Thought Objects Cluster */}
                <div className="absolute inset-0 pointer-events-none">
                    {thoughts.map(t => (
                        <div 
                            key={t.id}
                            className={`absolute w-20 h-20 cursor-pointer pointer-events-auto transition-all duration-500 ${activeThought?.id === t.id ? 'scale-125' : ''}`}
                            style={{ 
                                left: `${t.x}%`, 
                                top: `${t.y}%`, 
                                transform: `scale(${t.scale})`,
                                opacity: t.tagged ? 0 : 0.8,
                                backgroundImage: `url(${assets.thoughtPack})`,
                                backgroundSize: '400% 100%',
                                backgroundPosition: `${(t.variant * 100) / 3}% center`,
                                filter: t.tagged ? 'brightness(3) blur(4px)' : 'drop-shadow(0 0 15px rgba(255,255,255,0.2))',
                                animation: 'float 6s ease-in-out infinite'
                            }}
                            onClick={() => setActiveThought(t)}
                        />
                    ))}
                </div>

                {/* Authoritative Wooden Frame (Foreground UI Layer) */}
                <div 
                    className="absolute inset-0 bg-cover bg-center pointer-events-none z-20"
                    style={{ 
                        backgroundImage: `url(${assets.frame})`,
                    }}
                />

                {/* Tagging Interface (Right Panel Focus) */}
                <div className="absolute right-[4%] top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleTag(cat.id)}
                            disabled={!activeThought}
                            className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center transition-all duration-300
                                ${activeThought ? 'opacity-100 translate-x-0' : 'opacity-10 translate-x-4 pointer-events-none'}
                                border border-white/20 bg-black/40 backdrop-blur-md
                                hover:bg-white/10 hover:border-white/40
                            `}
                            style={{ 
                                boxShadow: activeThought ? `0 0 20px ${cat.color}20` : 'none'
                             }}
                        >
                            <span className="text-[14px] mb-1">{cat.icon}</span>
                            <span className="text-[8px] font-black tracking-widest text-white/90">{cat.label}</span>
                        </button>
                    ))}

                    <div className="h-px bg-white/10 my-2" />
                    
                    <button 
                        onClick={onExit}
                        className="w-16 h-10 rounded-lg flex items-center justify-center bg-red-900/40 border border-red-500/30 text-red-200/60 hover:text-red-100 hover:bg-red-800/60 transition-all text-[9px] font-bold tracking-widest"
                    >
                        STOP
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    33% { transform: translateY(-10px) rotate(1deg); }
                    66% { transform: translateY(5px) rotate(-1deg); }
                }
            `}</style>
        </div>
    );
}

export default InsightMeditationPortal;
