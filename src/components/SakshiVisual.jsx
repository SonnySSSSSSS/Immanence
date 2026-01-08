import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDisplayModeStore } from '../state/displayModeStore';

export function SakshiVisual() {
    const { mode } = useDisplayModeStore();
    const isHearth = mode === 'hearth';
    const assetsPrefix = import.meta.env.BASE_URL + 'assets/';

    const [offset, setOffset] = useState(0);
    const [thoughts, setThoughts] = useState([]);
    const lastSpawnTime = useRef(0);

    const assets = {
        frame: assetsPrefix + (isHearth ? 'homeSnow_hearth_stylized_frame.png' : 'homeSnow_sanctuary_stylized_frame.png'),
        bg: assetsPrefix + (isHearth ? 'homeSnow_hearth_stylized_bg.png' : 'homeSnow_sanctuary_stylized_bg.png'),
        mid: assetsPrefix + (isHearth ? 'homeSnow_hearth_stylized_mid.png' : 'homeSnow_sanctuary_stylized_mid.png'),
        thoughtPack: assetsPrefix + 'thoughtObjects_homeSnow_stylized_pack.png',
    };

    const spawnThought = useCallback(() => {
        const id = Date.now();
        const fromLeft = Math.random() > 0.5;
        const newThought = {
            id,
            x: fromLeft ? -10 : 110,
            y: 35 + Math.random() * 30, // Random vertical position in midground
            vx: fromLeft ? (0.1 + Math.random() * 0.15) : -(0.1 + Math.random() * 0.15),
            scale: 0.5 + Math.random() * 0.5,
            variant: Math.floor(Math.random() * 4),
        };
        setThoughts(prev => [...prev, newThought]);
        lastSpawnTime.current = id;
    }, []);

    useEffect(() => {
        let startTime = performance.now();
        let animationFrame;

        const animate = (time) => {
            const elapsed = (time - startTime) / 1000;
            
            // Slow background drift
            setOffset((elapsed * 12) % 430);

            // Update thoughts
            setThoughts(prev => prev.map(t => ({
                ...t,
                x: t.x + t.vx,
                y: t.y + (Math.sin(elapsed * 1.5 + t.id) * 0.08), // Gentle sway
            })).filter(t => t.x > -20 && t.x < 120));

            // Auto-spawn
            if (Date.now() - lastSpawnTime.current > 3500 && Math.random() < 0.02) {
                spawnThought();
            }

            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [spawnThought]);

    return (
        <div className="relative w-full h-64 overflow-hidden rounded-2xl bg-[#0a0a0f] shadow-2xl border border-white/10">
            {/* Background Layer (Sky/Dist ) */}
            <div 
                className="absolute inset-0 bg-repeat-x bg-cover"
                style={{
                    backgroundImage: `url(${assets.bg})`,
                    transform: `translateX(-${offset}px)`,
                    width: '300%',
                    opacity: 0.7
                }}
            />

            {/* Midground Layer (Trees/Snow) */}
            <div 
                className="absolute inset-0 bg-repeat-x bg-cover opacity-60"
                style={{
                    backgroundImage: `url(${assets.mid})`,
                    transform: `translateX(-${offset * 1.5}px)`,
                    width: '300%',
                }}
            />

            {/* Drifting Thoughts (The stylized assets) */}
            <div className="absolute inset-0 pointer-events-none">
                {thoughts.map(t => (
                    <div 
                        key={t.id}
                        className="absolute w-12 h-12 opacity-80"
                        style={{ 
                            left: `${t.x}%`, 
                            top: `${t.y}%`, 
                            transform: `scale(${t.scale})`,
                            backgroundImage: `url(${assets.thoughtPack})`,
                            backgroundSize: '400% 100%',
                            backgroundPosition: `${(t.variant * 100) / 3}% center`,
                            transition: 'opacity 1s ease',
                            filter: 'blur(0.5px)'
                        }}
                    />
                ))}
            </div>

            {/* Soft Fog Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* The Stylized Window Frame - Multi-blended for depth */}
            <div 
                className="absolute inset-0 bg-cover bg-center mix-blend-screen opacity-90 shadow-inner"
                style={{
                    backgroundImage: `url(${assets.frame})`,
                }}
            />
            
            {/* Final Atmospheric Bloom */}
            <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] pointer-events-none" />
        </div>
    );
}

export default SakshiVisual;
