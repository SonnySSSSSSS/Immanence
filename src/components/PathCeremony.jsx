// src/components/PathCeremony.jsx
// Full-screen ceremonial modal for path emergence and shift

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathStore, PATH_SYMBOLS, PATH_NAMES } from '../state/pathStore';
import { getEmergenceText, getFullShiftText } from '../data/pathDescriptions';
import { Avatar } from './avatar';

/**
 * PathCeremony — A full-screen ceremonial modal
 * 
 * Displays when:
 * - Path first emerges (90 days)
 * - Path shifts (180 days of new pattern)
 * 
 * Features:
 * - Full-screen overlay with dimmed backdrop
 * - Avatar with transitioning FX
 * - Path symbol + name
 * - Narrative text
 * - Audio (15s ceremony music)
 * - Share button (captures screenshot)
 * - Continue button
 */

const CEREMONY_AUDIO_PATH = `${import.meta.env.BASE_URL}assets/audio/path-ceremony-transition.mp3`;

export function PathCeremony({ stage = 'flame' }) {
    const pendingCeremony = usePathStore(s => s.pendingCeremony);
    const dismissCeremony = usePathStore(s => s.dismissCeremony);

    const [isVisible, setIsVisible] = useState(false);
    const [animationPhase, setAnimationPhase] = useState('entering'); // entering | revealed | exiting
    const [canShare, setCanShare] = useState(false);
    const audioRef = useRef(null);
    const containerRef = useRef(null);

    // Check if share is available
    useEffect(() => {
        setCanShare(!!navigator.share || !!navigator.clipboard);
    }, []);

    // Show ceremony when pendingCeremony changes
    useEffect(() => {
        if (pendingCeremony) {
            setIsVisible(true);
            setAnimationPhase('entering');

            // Play audio
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {
                    // Audio autoplay may be blocked — that's fine
                });
            }

            // Transition to revealed phase
            const timer = setTimeout(() => {
                setAnimationPhase('revealed');
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [pendingCeremony]);

    // Handle continue click
    const handleContinue = useCallback(() => {
        setAnimationPhase('exiting');

        // Stop audio
        if (audioRef.current) {
            audioRef.current.pause();
        }

        setTimeout(() => {
            setIsVisible(false);
            dismissCeremony();
        }, 500);
    }, [dismissCeremony]);

    // Handle share
    const handleShare = useCallback(async () => {
        if (!pendingCeremony) return;

        const { type, path, previousPath } = pendingCeremony;
        const stageName = stage.charAt(0).toUpperCase() + stage.slice(1);
        const pathName = PATH_NAMES[path];
        const symbol = PATH_SYMBOLS[path];

        const shareText = type === 'emergence'
            ? `My path has emerged: ${stageName} - ${pathName} Path ${symbol}\n\n#ImmanenceOS #Consciousness`
            : `My path has shifted: ${PATH_NAMES[previousPath]} → ${pathName} ${symbol}\n\n#ImmanenceOS #Consciousness`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Immanence OS - Path Ceremony',
                    text: shareText,
                });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareText);
                // Could show a toast here
            }
        } catch (e) {
            console.log('Share cancelled or failed:', e);
        }
    }, [pendingCeremony, stage]);

    // Don't render if not visible
    if (!isVisible || !pendingCeremony) {
        return null;
    }

    const { type, path, previousPath } = pendingCeremony;
    const symbol = PATH_SYMBOLS[path];
    const pathName = PATH_NAMES[path];
    const stageName = stage.charAt(0).toUpperCase() + stage.slice(1);

    // Get ceremony text
    let narrativeText = '';
    if (type === 'emergence') {
        narrativeText = getEmergenceText(path);
    } else if (type === 'shift') {
        const { fromText, toText } = getFullShiftText(previousPath, path);
        narrativeText = `${fromText}\n\n${toText}`;
    }

    const title = type === 'emergence' ? 'YOUR PATH EMERGES' : 'A SHIFT EMERGES';

    return (
        <div
            ref={containerRef}
            className={`path-ceremony-overlay ${animationPhase}`}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at center, rgba(10, 10, 18, 0.98) 0%, rgba(5, 5, 8, 0.99) 100%)',
                opacity: animationPhase === 'exiting' ? 0 : 1,
                transition: 'opacity 0.5s ease-out',
                padding: '2rem',
                overflow: 'auto',
            }}
        >
            {/* Audio element */}
            <audio ref={audioRef} src={CEREMONY_AUDIO_PATH} preload="auto" />

            {/* Title */}
            <h1
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    letterSpacing: 'var(--tracking-mythic)',
                    color: 'var(--accent-color, #fcd34d)',
                    marginBottom: '2rem',
                    opacity: animationPhase === 'entering' ? 0 : 1,
                    transform: animationPhase === 'entering' ? 'translateY(-20px)' : 'translateY(0)',
                    transition: 'all 0.8s ease-out 0.2s',
                    textTransform: 'uppercase'
                }}
            >
                {title}
            </h1>

            {/* Avatar */}
            <div
                style={{
                    opacity: animationPhase === 'entering' ? 0 : 1,
                    transform: animationPhase === 'entering' ? 'scale(0.8)' : 'scale(1)',
                    transition: 'all 0.8s ease-out 0.4s',
                    marginBottom: '1.5rem',
                }}
            >
                <Avatar
                    mode="home"
                    stage={stage}
                    path={path}
                    showCore={false}
                />
            </div>

            {/* Stage and Path */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    opacity: animationPhase === 'entering' ? 0 : 1,
                    transition: 'opacity 0.8s ease-out 0.6s',
                }}
            >
                <div
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-wide)',
                        color: 'var(--accent-color, #fcd34d)',
                        marginBottom: '0.25rem',
                    }}
                >
                    {stageName.toUpperCase()}
                </div>
                <div
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        fontSize: '1.125rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>{symbol}</span>
                    <span>{pathName} Path</span>
                </div>
            </div>

            {/* Shift indicator (if shift ceremony) */}
            {type === 'shift' && previousPath && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '1rem',
                        opacity: animationPhase === 'entering' ? 0 : 1,
                        transition: 'opacity 0.8s ease-out 0.7s',
                    }}
                >
                    <span>{PATH_SYMBOLS[previousPath]}</span>
                    <span>→</span>
                    <span style={{ color: 'var(--accent-color, #fcd34d)' }}>{symbol}</span>
                </div>
            )}

            {/* Divider */}
            <div
                style={{
                    width: '80%',
                    maxWidth: '400px',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    marginBottom: '1.5rem',
                    opacity: animationPhase === 'entering' ? 0 : 1,
                    transition: 'opacity 0.8s ease-out 0.7s',
                }}
            />

            {/* Narrative text */}
            <div
                style={{
                    maxWidth: '500px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontSize: '1rem',
                    lineHeight: 1.8,
                    color: 'rgba(255, 255, 255, 0.85)',
                    marginBottom: '2rem',
                    whiteSpace: 'pre-wrap',
                    opacity: animationPhase === 'entering' ? 0 : 1,
                    transition: 'opacity 0.8s ease-out 0.9s',
                }}
            >
                {narrativeText}
            </div>

            {/* Buttons */}
            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    opacity: animationPhase === 'entering' ? 0 : 1,
                    transition: 'opacity 0.8s ease-out 1.1s',
                }}
            >
                {canShare && (
                    <button
                        onClick={handleShare}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            letterSpacing: 'var(--tracking-mythic)',
                            fontSize: '0.875rem',
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '2rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            e.target.style.borderColor = 'var(--accent-color, #fcd34d)';
                            e.target.style.color = 'var(--accent-color, #fcd34d)';
                        }}
                        onMouseLeave={e => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                        }}
                    >
                        Share
                    </button>
                )}
                <button
                    onClick={handleContinue}
                    style={{
                        padding: '0.75rem 2rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-wide)',
                        fontSize: '0.875rem',
                        background: 'var(--ui-button-gradient, linear-gradient(135deg, #fcd34d, #f59e0b))',
                        border: 'none',
                        borderRadius: '2rem',
                        color: '#050508',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={e => {
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

export default PathCeremony;
