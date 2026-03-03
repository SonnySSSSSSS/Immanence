import { useState } from 'react';

/**
 * useProbeState - Consolidates all debug/monitoring probe variables
 * Tracks guidance context, practice start callsites, and path context for development debugging
 */
export function useProbeState() {
  // Guidance context overlay probes
  const [curGuideProbeSourceTag, setCurGuideProbeSourceTag] = useState(undefined);
  const [curGuideProbePathId, setCurGuideProbePathId] = useState(undefined);
  const [curGuideProbeSlotIndex, setCurGuideProbeSlotIndex] = useState(undefined);
  const [curGuideProbeGuidanceUrl, setCurGuideProbeGuidanceUrl] = useState(undefined);
  const [curGuideProbeKeys, setCurGuideProbeKeys] = useState(undefined);

  // Last guidance context state
  const [lastGuideProbeSourceTag, setLastGuideProbeSourceTag] = useState(undefined);
  const [lastGuideProbePathId, setLastGuideProbePathId] = useState(undefined);
  const [lastGuideProbeSlotIndex, setLastGuideProbeSlotIndex] = useState(undefined);
  const [lastGuideProbeGuidanceUrl, setLastGuideProbeGuidanceUrl] = useState(undefined);
  const [lastGuideProbeKeys, setLastGuideProbeKeys] = useState(undefined);

  // Practice start callsite tracking
  const [activePracticeIdentity, setActivePracticeIdentity] = useState(undefined);
  const [lastStartCaller, setLastStartCaller] = useState(undefined);
  const [lastStartAtMsAgo, setLastStartAtMsAgo] = useState(undefined);

  // Path context at start
  const [apcPathIdProbe, setApcPathIdProbe] = useState(undefined);
  const [apcSlotIndexProbe, setApcSlotIndexProbe] = useState(undefined);

  // Guidance resolution at start
  const [resolvedGuidanceUrlProbe, setResolvedGuidanceUrlProbe] = useState(undefined);

  return {
    // Current guidance context
    curGuideProbeSourceTag,
    setCurGuideProbeSourceTag,
    curGuideProbePathId,
    setCurGuideProbePathId,
    curGuideProbeSlotIndex,
    setCurGuideProbeSlotIndex,
    curGuideProbeGuidanceUrl,
    setCurGuideProbeGuidanceUrl,
    curGuideProbeKeys,
    setCurGuideProbeKeys,

    // Last guidance context
    lastGuideProbeSourceTag,
    setLastGuideProbeSourceTag,
    lastGuideProbePathId,
    setLastGuideProbePathId,
    lastGuideProbeSlotIndex,
    setLastGuideProbeSlotIndex,
    lastGuideProbeGuidanceUrl,
    setLastGuideProbeGuidanceUrl,
    lastGuideProbeKeys,
    setLastGuideProbeKeys,

    // Practice start tracking
    activePracticeIdentity,
    setActivePracticeIdentity,
    lastStartCaller,
    setLastStartCaller,
    lastStartAtMsAgo,
    setLastStartAtMsAgo,

    // Path context at start
    apcPathIdProbe,
    setApcPathIdProbe,
    apcSlotIndexProbe,
    setApcSlotIndexProbe,

    // Guidance resolution at start
    resolvedGuidanceUrlProbe,
    setResolvedGuidanceUrlProbe,
  };
}
