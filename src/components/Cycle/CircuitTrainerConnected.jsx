// src/components/Cycle/CircuitTrainerConnected.jsx
// Phase 2: CircuitTrainer connected to Zustand stores
// Replaces service calls with circuit integration layer

import React, { useState, useCallback } from 'react';
import { CircuitTrainer } from './CircuitTrainer';
import { initializeCircuitSession } from '../../services/circuitIntegration';

/**
 * CircuitTrainerConnected
 * Wrapper around CircuitTrainer that handles store integration
 * 
 * Props:
 *   onCircuitStarted - Called when user selects circuit, passes back the session
 *   onError - Called if initialization fails
 */
export function CircuitTrainerConnected({ onCircuitStarted, onError }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectCircuit = useCallback((circuit) => {
        setIsLoading(true);

        try {
            // Initialize session in Zustand store
            const result = initializeCircuitSession(circuit);

            if (!result.success) {
                console.error('Circuit initialization failed:', result.error);
                if (onError) onError(result.error);
                setIsLoading(false);
                return;
            }

            // Pass session info to parent (likely to circuit practice UI)
            if (onCircuitStarted) {
                onCircuitStarted({
                    circuit: result.session,
                    sessionId: result.sessionId,
                    totalDuration: result.totalDuration,
                    exercises: result.exercises
                });
            }
        } catch (err) {
            console.error('Error starting circuit:', err);
            if (onError) onError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [onCircuitStarted, onError]);

    return (
        <CircuitTrainer
            onSelectCircuit={handleSelectCircuit}
            isLoading={isLoading}
        />
    );
}

export default CircuitTrainerConnected;
