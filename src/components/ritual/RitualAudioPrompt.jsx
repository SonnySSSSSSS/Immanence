import React, { useEffect, useRef } from 'react';

export function RitualAudioPrompt({ audioUrl, onComplete }) {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
        }
    }, [audioUrl]);

    return (
        <div className="hidden">
            <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={onComplete}
            />
        </div>
    );
}
