import React, { useRef, useEffect } from 'react';

/**
 * PersonalityWave - A canvas-based visualization of Big Five personality scores.
 * Modulates wave parameters (amplitude, frequency, speed, turbulence) based on traits.
 */
export function PersonalityWave({ scores, width = 400, height = 150 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;

        // Default scores if null or partial
        const bf = {
            openness: scores?.openness ?? 0.5,
            conscientiousness: scores?.conscientiousness ?? 0.5,
            extraversion: scores?.extraversion ?? 0.5,
            agreeableness: scores?.agreeableness ?? 0.5,
            neuroticism: scores?.neuroticism ?? 0.5
        };
        // Wave parameters driven by personality
        // Openness -> Complexity (more sub-waves)
        // Neuroticism -> Amplitude & Turbulence (spikier movements)
        // Extraversion -> Speed
        // Conscientiousness -> Regularity (inverse of turbulence)
        // Agreeableness -> Color shift

        const baseAmplitude = 20 + bf.neuroticism * 30;
        const frequency = 0.01 + bf.openness * 0.02;
        const speed = 0.02 + bf.extraversion * 0.05;
        const turbulence = bf.neuroticism * 0.5 + (1 - bf.conscientiousness) * 0.5;

        const render = () => {
            time += speed;
            ctx.clearRect(0, 0, width, height);

            // Create organic gradient based on Agreeableness
            // High agreeableness = warm/soft; Low = sharp/cool
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            if (bf.agreeableness > 0.6) {
                gradient.addColorStop(0, 'rgba(200, 180, 255, 0.4)'); // Lavender
                gradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.6)'); // Soft Blue
                gradient.addColorStop(1, 'rgba(200, 180, 255, 0.4)');
            } else {
                gradient.addColorStop(0, 'rgba(100, 80, 180, 0.4)'); // Deep Purple
                gradient.addColorStop(0.5, 'rgba(60, 150, 180, 0.6)'); // Steel Blue
                gradient.addColorStop(1, 'rgba(100, 80, 180, 0.4)');
            }

            ctx.beginPath();
            ctx.moveTo(0, height / 2);

            for (let x = 0; x <= width; x++) {
                // Primary wave
                let y = Math.sin(x * frequency + time) * baseAmplitude;

                // Secondary harmonic (Openness adds complexity)
                y += Math.sin(x * frequency * 2.5 + time * 1.5) * (baseAmplitude * 0.3 * bf.openness);

                // Turbulence (Neuroticism/Conscientiousness)
                if (turbulence > 0.1) {
                    y += Math.sin(x * frequency * 5 + time * 3) * (turbulence * 10);
                }

                ctx.lineTo(x, height / 2 + y);
            }

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Add a faint glow/fill
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);

            const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
            if (bf.agreeableness > 0.6) {
                fillGradient.addColorStop(0, 'rgba(200, 180, 255, 0.05)');
                fillGradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.1)');
                fillGradient.addColorStop(1, 'rgba(200, 180, 255, 0.05)');
            } else {
                fillGradient.addColorStop(0, 'rgba(100, 80, 180, 0.05)');
                fillGradient.addColorStop(0.5, 'rgba(60, 150, 180, 0.1)');
                fillGradient.addColorStop(1, 'rgba(100, 80, 180, 0.05)');
            }
            ctx.fillStyle = fillGradient;
            ctx.fill();

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [scores, width, height]);

    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-black/20 border border-white/5">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full h-auto block"
            />

            {/* Overlay labels for the points */}
            <div className="absolute inset-x-4 top-2 flex justify-between pointer-events-none">
                <span className="text-[9px] uppercase tracking-widest text-white/20">Openness</span>
                <span className="text-[9px] uppercase tracking-widest text-white/20">Stability</span>
            </div>
        </div>
    );
}
