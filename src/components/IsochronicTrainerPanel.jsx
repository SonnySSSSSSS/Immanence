import React, { useEffect, useRef } from "react";
import { useIsochronicEngine } from "../audio/useIsochronicEngine";

export function IsochronicTrainerPanel({
  pulseHz,
  volume,
  isAdjustingFrequency = false,
  reverbWet = 0,
  chorusWet = 0,
}) {
  const {
    isReady,
    isRunning,
    start,
    stop,
    setPulseHz,
    setMasterGain,
    setReverbWet,
    setChorusWet,
  } = useIsochronicEngine();

  const volumeRef = useRef(volume);

  // Always keep volumeRef current
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Apply pulse frequency when it changes
  useEffect(() => {
    if (typeof pulseHz === "number") {
      console.log("[Iso] setPulseHz:", pulseHz);
      setPulseHz(pulseHz);
    }
  }, [pulseHz, setPulseHz]);

  // Apply volume gain immediately whenever volume changes
  // This is independent of adjustment state
  useEffect(() => {
    console.log("[Iso] Volume effect triggered. volume:", volume, "isReady:", isReady);
    if (typeof volume === "number" && isReady) {
      console.log("[Iso] Calling setMasterGain with:", volume);
      setMasterGain(volume);
    }
  }, [volume, isReady, setMasterGain]);

  // Apply FX wet levels immediately on change
  useEffect(() => {
    if (typeof reverbWet === "number") {
      setReverbWet(reverbWet);
    }
  }, [reverbWet, setReverbWet]);

  useEffect(() => {
    if (typeof chorusWet === "number") {
      setChorusWet(chorusWet);
    }
  }, [chorusWet, setChorusWet]);

  // Manage audio play/pause based on frequency adjustment
  useEffect(() => {
    console.log("[Iso] Adjustment state changed. isAdjustingFrequency:", isAdjustingFrequency);
    if (isAdjustingFrequency) {
      // Pause during adjustment
      console.log("[Iso] Pausing audio");
      stop();
    } else {
      // Resume after adjustment, with a small delay to let stop() complete
      console.log("[Iso] Scheduling audio resume");
      const timer = setTimeout(() => {
        console.log("[Iso] Resuming audio");
        start();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAdjustingFrequency, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[Iso] Unmounting, stopping audio");
      stop();
    };
  }, [stop]);

  console.log("[Iso] Panel render. isReady:", isReady, "isRunning:", isRunning, "volume:", volume);

  return (
    <div className="text-center text-xs opacity-70">
      {isAdjustingFrequency
        ? "Audio paused for adjustment…"
        : (isReady
          ? (isRunning ? "Isochronic pulses active" : "Isochronic engine idle")
          : "Preparing audio engine…")}
    </div>
  );
}
