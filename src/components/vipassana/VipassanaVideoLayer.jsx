// src/components/vipassana/VipassanaVideoLayer.jsx
// Transparent video overlay for Vipassana practice
// Uses WebM with alpha transparency for clean compositing

import { useRef, useEffect, useState } from 'react';

// WebM with alpha transparency (VP9 codec) - the only browser-supported transparent video format
// Updated with new clean alpha channel videos
const VIDEO_SOURCES = {
    leaves: 'vipassana/background videos/assets/Gentle_Leaf_Movement_in_Dense_Air no watermark.mp4',
    birds: 'vipassana/background videos/assets/Distant_Birds_Silhouettes_Ambient_Motion no watermark.mp4',
    lanterns: 'vipassana/background videos/assets/Ambient_Sky_Lanterns_Video_Generation no watermark.mp4',
    clouds: 'vipassana/background videos/assets/clouds.mov',
};

// Per-video-type positioning to fit portrait wallpaper
// All videos are 1920x1080 (16:9) and need to fit in portrait (9:16) UI
const VIDEO_CONFIGS = {
    leaves: {
        scale: 0.35,           // Smaller for leaves drifting
        translateY: '-75%',    // Upper portion of sky
        opacity: 0.1,          // Very subtle
    },
    birds: {
        scale: 0.4,            // Medium for bird flock
        translateY: '-80%',    // High in sky
        opacity: 0.1,          // Very subtle
    },
    lanterns: {
        scale: 0.5,            // Larger for lanterns floating
        translateY: '-70%',    // Upper sky
        opacity: 0.1,          // Very subtle
    },
    clouds: {
        scale: 0.6,            // Larger for clouds passing
        translateY: '-65%',    // Mid-upper sky
        opacity: 0.1,          // Very subtle
    },
};

export function VipassanaVideoLayer({
    videoType = 'leaves',
    enabled = true,
}) {
    const videoRef = useRef(null);
    const [videoReady, setVideoReady] = useState(false);

    // Get video source
    const source = VIDEO_SOURCES[videoType];
    const videoSrc = source ? `${import.meta.env.BASE_URL}${source}` : null;

    // Force video playback after mount and handle seamless looping
    useEffect(() => {
        // Skip if disabled or no source
        if (!enabled || !videoSrc) return;

        const video = videoRef.current;
        if (!video) return;

        const playVideo = async () => {
            try {
                video.muted = true;
                video.loop = true;
                video.playbackRate = 0.6; // Slow to 60% speed (40% slower)

                // Wait for video to be ready before playing
                if (video.readyState >= 3) {
                    // Video is loaded enough to play
                    await video.play();
                    setVideoReady(true);
                } else {
                    // Wait for loadeddata event
                    video.addEventListener('loadeddata', async () => {
                        await video.play();
                        setVideoReady(true);
                    }, { once: true });
                }
            } catch (err) {
                console.warn('Video autoplay blocked:', err);
            }
        };

        // Handle seamless looping by manually restarting on end
        // This prevents the pause that sometimes occurs with native loop
        const handleEnded = () => {
            if (video) {
                video.currentTime = 0;
                video.play().catch(err => console.warn('Loop restart failed:', err));
            }
        };

        video.addEventListener('ended', handleEnded);

        // Small delay to ensure DOM is ready
        const timer = setTimeout(playVideo, 100);

        return () => {
            clearTimeout(timer);
            video.removeEventListener('ended', handleEnded);
        };
    }, [enabled, videoSrc]);

    // Get video-specific config (fallback to birds config)
    const config = VIDEO_CONFIGS[videoType] || VIDEO_CONFIGS.birds;

    // Early return after all hooks
    if (!enabled || !source) return null;

    return (
        <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
            style={{
                opacity: videoReady ? 1 : 0,
                transition: 'opacity 2s ease-in',
            }}
        >
            {/* Container matching wallpaper aspect ratio (9:16 portrait) */}
            <div
                className="relative overflow-hidden"
                style={{
                    // Match portrait wallpaper aspect ratio
                    aspectRatio: '9 / 16',
                    height: '100%',
                    maxWidth: '100%',
                }}
            >
                {/* Video layer - positioned per video type within the wallpaper bounds */}
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
                        transform: `translate(-50%, ${config.translateY}) scale(${config.scale})`,
                        opacity: config.opacity,
                        filter: 'blur(1px)', // Soft haze for depth
                    }}
                />
            </div>
        </div>
    );
}

export default VipassanaVideoLayer;


