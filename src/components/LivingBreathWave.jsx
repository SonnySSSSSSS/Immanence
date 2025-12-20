// src/components/LivingBreathWave.jsx
import React, { useEffect, useRef } from 'react';

export function LivingBreathWave({ pattern }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Calculate total duration for relative width scaling
    const totalDuration = (pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2) || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Resize handler
        const resize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };
        resize();
        window.addEventListener('resize', resize);

        // Animation loop
        const startTime = Date.now();

        // Speed multiplier for preview
        const SPEED_MULTIPLIER = 3.0;

        const animate = () => {
            const width = canvas.width;
            const height = canvas.height;
            const padding = 20;
            const effectiveWidth = width - (padding * 2);

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Calculate segment widths based on time
            const inhaleW = (pattern.inhale / totalDuration) * effectiveWidth;
            const hold1W = (pattern.hold1 / totalDuration) * effectiveWidth;
            const exhaleW = (pattern.exhale / totalDuration) * effectiveWidth;
            const hold2W = (pattern.hold2 / totalDuration) * effectiveWidth;

            // Define key points
            const startX = padding;
            const startY = height - padding; // Bottom (Empty)
            const topY = padding;            // Top (Full)

            // Calculate key coordinates
            const p0 = { x: startX, y: startY };
            const p1 = { x: startX + inhaleW, y: topY };
            const p2 = { x: startX + inhaleW + hold1W, y: topY };
            const p3 = { x: startX + inhaleW + hold1W + exhaleW, y: startY };
            const p4 = { x: startX + inhaleW + hold1W + exhaleW + hold2W, y: startY };

            // Draw Static Path (Linear Trapezoid)
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y); // Inhale (Linear Up)
            ctx.lineTo(p2.x, p2.y); // Hold Top (Flat)
            ctx.lineTo(p3.x, p3.y); // Exhale (Linear Down)
            ctx.lineTo(p4.x, p4.y); // Hold Bottom (Flat)

            // Stroke styles
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            // Glow overlay
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.1)'; // Amber glow
            ctx.lineWidth = 6;
            ctx.stroke();


            // --- ANIMATED PARTICLE ---

            const elapsed = (Date.now() - startTime) / 1000 * SPEED_MULTIPLIER;
            const cycleTime = elapsed % totalDuration;

            let particleX = startX;
            let particleY = startY;

            if (cycleTime < pattern.inhale) {
                // Inhale (Linear interpolation)
                const t = cycleTime / pattern.inhale;
                // Linear ease for professional look
                particleX = p0.x + (p1.x - p0.x) * t;
                particleY = p0.y + (p1.y - p0.y) * t;

            } else if (cycleTime < pattern.inhale + pattern.hold1) {
                // Hold Top
                const t = (cycleTime - pattern.inhale) / pattern.hold1;
                particleX = p1.x + (p2.x - p1.x) * t;
                particleY = topY;
            } else if (cycleTime < pattern.inhale + pattern.hold1 + pattern.exhale) {
                // Exhale
                const t = (cycleTime - (pattern.inhale + pattern.hold1)) / pattern.exhale;
                particleX = p2.x + (p3.x - p2.x) * t;
                particleY = p2.y + (p3.y - p2.y) * t;
            } else {
                // Hold Bottom
                const t = (cycleTime - (pattern.inhale + pattern.hold1 + pattern.exhale)) / pattern.hold2;
                particleX = p3.x + (p4.x - p3.x) * t;
                particleY = startY;
            }

            // Draw Particle
            ctx.beginPath();
            ctx.arc(particleX, particleY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24'; // Amber-400
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.fill();

            // Small pulse ring
            const pulse = (Math.sin(elapsed * 10) + 1) / 2;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 4 + pulse * 6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(251, 191, 36, ${0.4 - pulse * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, [pattern, totalDuration]);

    return (
        <div
            ref={containerRef}
            className="w-full h-32 relative mb-8 rounded-xl overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* Labels overlay */}
            <div className="absolute bottom-3 left-3 text-[9px] text-white/30 font-[Georgia] tracking-wider uppercase">
                {totalDuration}s Cycle
            </div>
        </div>
    );
}
