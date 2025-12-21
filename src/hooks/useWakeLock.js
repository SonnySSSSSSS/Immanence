import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage Screen Wake Lock API.
 * Prevents the screen from dimming/sleeping when active.
 */
export function useWakeLock(enabled = false) {
    const wakeLockRef = useRef(null);

    const requestWakeLock = useCallback(async () => {
        if (!('wakeLock' in navigator)) {
            console.warn('Wake Lock API not supported in this browser.');
            return;
        }

        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.log('Wake Lock active.');

            wakeLockRef.current.addEventListener('release', () => {
                console.log('Wake Lock released.');
            });
        } catch (err) {
            console.error(`Wake Lock Error: ${err.message}`);
        }
    }, []);

    const releaseWakeLock = useCallback(() => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (enabled) {
            requestWakeLock();

            // Re-request if the page becomes visible again (e.g. user switched tabs)
            const handleVisibilityChange = () => {
                if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
                    requestWakeLock();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                releaseWakeLock();
            };
        } else {
            releaseWakeLock();
        }
    }, [enabled, requestWakeLock, releaseWakeLock]);

    return { requestWakeLock, releaseWakeLock };
}
