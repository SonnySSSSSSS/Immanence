// src/components/VipassanaVisual.jsx
// Vipassana visualization using lake image asset

import React, { useRef, useEffect } from 'react';

export function VipassanaVisual({ elapsedSeconds = 0 }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const ripplesRef = useRef([]);
    const imageRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Load the lake image
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}vipassana-lake.png`;
        img.onload = () => {
            imageRef.current = img;
        };

        // Get accent color
        const getAccentColor = () => {
            const style = getComputedStyle(document.documentElement);
            return style.getPropertyValue('--accent-color').trim() || '#d4a574';
        };

        // Create ambient ripples
        const createRipple = () => {
            const offsetX = (Math.random() - 0.5) * width * 0.3;
            const offsetY = (Math.random() - 0.5) * height * 0.3;

            ripplesRef.current.push({
                x: centerX + offsetX,
                y: centerY + offsetY,
                radius: 0,
                maxRadius: 60 + Math.random() * 40,
                opacity: 0.2 + Math.random() * 0.15,
                speed: 0.4 + Math.random() * 0.3,
            });

            if (ripplesRef.current.length > 6) {
                ripplesRef.current.shift();
            }
        };

        // Initial ripples
        for (let i = 0; i < 2; i++) {
            setTimeout(() => createRipple(), i * 1500);
        }

        // Periodic ripple creation
        const rippleInterval = setInterval(() => {
            if (Math.random() > 0.4) {
                createRipple();
            }
        }, 3000);

        const animate = () => {
            // Draw lake image as background
            if (imageRef.current) {
                ctx.drawImage(imageRef.current, 0, 0, width, height);
            } else {
                ctx.fillStyle = 'rgba(15, 20, 30, 1)';
                ctx.fillRect(0, 0, width, height);
            }

            const accentColor = getAccentColor();

            // Draw ripples
            ripplesRef.current.forEach((ripple, index) => {
                ripple.radius += ripple.speed;
                const progress = ripple.radius / ripple.maxRadius;
                const fadeOpacity = ripple.opacity * (1 - progress);

                if (fadeOpacity > 0.01) {
                    ctx.beginPath();
                    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = accentColor;
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = fadeOpacity;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                if (ripple.radius >= ripple.maxRadius) {
                    ripplesRef.current.splice(index, 1);
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            clearInterval(rippleInterval);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="relative w-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={400}
                height={256}
                className="rounded-2xl"
                style={{
                    maxWidth: '100%',
                    border: '1px solid var(--accent-10)',
                }}
            />

            {/* Subtle overlay text */}
            <div
                className="absolute bottom-4 left-0 right-0 text-center"
                style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '9px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(253,251,245,0.25)',
                }}
            >
                observe the stream
            </div>
        </div>
    );
}
