// src/components/vipassana/VipassanaVideoLayer.jsx
// Transparent video overlay for Vipassana practice
// Uses WebM with alpha transparency for clean compositing

import React, { useRef, useEffect, useState } from 'react';

// WebM with alpha transparency (VP9 codec) - the only browser-supported transparent video format
// Updated with new clean alpha channel videos
const VIDEO_SOURCES = {
    leaves: 'vipassana/background videos/leaves.webm',
    birds: 'vipassana/background videos/birds.webm',
    lanterns: 'vipassana/background videos/lanterns.webm',
    clouds: 'vipassana/background videos/clouds.webm',
};

export function VipassanaVideoLayer({
    videoType = 'leaves',
    enabled = true,
    opacity = 0.6,
}) {
    const videoRef = useRef(null);
    const [videoReady, setVideoReady] = useState(false);

    // Get video source
    const source = VIDEO_SOURCES[videoType];
    const videoSrc = source ? `${import.meta.env.BASE_URL}${source}` : null;

    // Force video playback after mount
    useEffect(() => {
        // Skip if disabled or no source
        if (!enabled || !videoSrc) return;

        const playVideo = async () => {
            try {
                if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.loop = true;
                    await videoRef.current.play();
                    setVideoReady(true);
                }
            } catch (err) {
                console.warn('Video autoplay blocked:', err);
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(playVideo, 100);
        return () => clearTimeout(timer);
    }, [enabled, videoSrc]);

    // Early return after all hooks
    if (!enabled || !source) return null;

    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
                opacity: videoReady ? 1 : 0,
                transition: 'opacity 2s ease-in',
            }}
        >
            {/* Single video layer - scaled down to look distant */}
            <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="pointer-events-none"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Preserve aspect ratio without cropping
                    transform: 'translate(-50%, -83%) scale(0.5)', // Center horizontally, position in top third
                    opacity: opacity * 0.2, // Very subtle atmospheric presence
                    filter: 'blur(1px)', // Soft haze for depth
                }}
            />
        </div>
    );
}

export default VipassanaVideoLayer;


