import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRitualStore } from '../../state/ritualStore';

const BASE = import.meta.env.BASE_URL || '/';

export function CameraCapture({ onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [showStopNotif, setShowStopNotif] = useState(false);
    const { setPhotoUrl } = useRitualStore();

    useEffect(() => {
        async function startCamera() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                setStream(s);
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                }
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        }
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !stream) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add a slight "ethereal" filter to the captured photo
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#D4B87A"; // Gold overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;

        const dataUrl = canvas.toDataURL('image/jpeg');
        
        // STOP CAMERA IMMEDIATELY FOR PRIVACY
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setShowStopNotif(true);

        setCapturedImage(dataUrl);
        setPhotoUrl(dataUrl);
        onCapture && onCapture(dataUrl);

        // Hide notification after 3 seconds
        setTimeout(() => setShowStopNotif(false), 3000);
    };

    return (
        <div className="relative w-full aspect-square max-w-sm rounded-[40px] overflow-hidden border border-white/10 bg-black shadow-2xl">
            {!capturedImage ? (
                <>
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover grayscale opacity-60"
                    />
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        <div 
                            className="absolute inset-x-8 inset-y-8 border border-white/20 rounded-3xl"
                            style={{
                                backgroundImage: `url(${BASE}assets/ritual/photo_hint_v1.png)`,
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                opacity: 0.3
                            }}
                        />
                    </div>
                </>
            ) : (
                <div className="relative w-full h-full">
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captured Witness" />
                    
                    {/* Privacy Confirmation Overlay */}
                    <AnimatePresence>
                        {showStopNotif && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-green-500/30 flex items-center gap-2 z-50 shadow-lg"
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-[2px]">Camera Offline • Secure</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <AnimatePresence>
                {!capturedImage && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={takePhoto}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 bg-white/20 backdrop-blur-md z-20 transition-transform active:scale-90"
                    >
                        <div className="w-full h-full rounded-full bg-white shadow-inner" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
