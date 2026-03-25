import { useCallback, useEffect, useRef, useState } from 'react';

export function useDevPanelPickers({
  canRunDevEffects,
  isOpen,
  devtoolsEnabled,
  isDevBuild,
  setPickMode,
  setPickDebugEnabled,
  findCardFromEvent,
  selectCard,
  emitPickerSelection,
  attachControlsCapture,
  detachControlsCapture,
  startControlsPicking,
  stopControlsPicking,
  getControlsFxPreset,
  setControlsFxDraft,
  getPlatesFxPreset,
  setPlatesFxDraft,
  setPlatesAdvancedOpen,
}) {
  const [practiceButtonPickMode, setPracticeButtonPickMode] = useState(false);
  const [practiceButtonApplyToAll, setPracticeButtonApplyToAll] = useState(true);
  const [practiceButtonSelectedKey, setPracticeButtonSelectedKey] = useState(null);
  const LEGACY_PICKERS_FLAG_KEY = 'immanence.dev.pickers.legacy.enabled';
  const [legacyPickersEnabled, setLegacyPickersEnabled] = useState(true);
  const PICK_DEBUG_FLAG_KEY = 'immanence.dev.pickers.pickDebug.enabled';
  const [pickDebugEnabled, setPickDebugEnabledLocal] = useState(false);
  const [universalPickerKind, setUniversalPickerKind] = useState('controls');
  const [universalPickMode, setUniversalPickMode] = useState(false);
  const [controlsSelectedId, setControlsSelectedId] = useState(null);
  const [controlsSelectedRoleGroup, setControlsSelectedRoleGroup] = useState(null);
  const [controlsSurfaceIsRoot, setControlsSurfaceIsRoot] = useState(false);
  const [controlsSurfaceDebug, setControlsSurfaceDebug] = useState(null);
  const [pickDebugResolvedMode, setPickDebugResolvedMode] = useState(null);
  const [pickDebugResolvedId, setPickDebugResolvedId] = useState(null);
  const [platesSelectedId, setPlatesSelectedId] = useState(null);

  const practiceButtonPickHandlerRef = useRef(null);
  const universalPickHandlerRef = useRef(null);

  const CONTROLS_PICK_STORAGE_KEY = 'immanence.dev.controlsFxPicker';
  const CONTROLS_PICK_EVENT = 'immanence-controls-fx-picker';
  const PRACTICE_BUTTON_PICK_STORAGE_KEY = 'immanence.dev.practiceButtonFxPicker';
  const PRACTICE_BUTTON_PICK_EVENT = 'immanence-practice-button-fx-picker';

  const broadcastControlsPicker = useCallback((next) => {
    if (typeof window === 'undefined') return;
    try {
      emitPickerSelection(CONTROLS_PICK_STORAGE_KEY, CONTROLS_PICK_EVENT, next);
    } catch {
      // ignore
    }
  }, [emitPickerSelection]);

  const logNearestAncestors = useCallback((label, eventTarget) => {
    if (!import.meta.env.DEV) return;
    try {
      const start = eventTarget instanceof Element ? eventTarget : null;
      const chain = [];
      let cur = start;
      while (cur && chain.length < 5) {
        const dataset = cur.dataset ? { ...cur.dataset } : {};
        chain.push({
          tag: String(cur.tagName || '').toLowerCase(),
          dataset,
        });
        cur = cur.parentElement;
      }
      console.info(`[picker][${label}] resolver miss - nearest ancestors`, chain);
    } catch (err) {
      console.info(`[picker][${label}] resolver miss - failed to log ancestors`, err);
    }
  }, []);

  const toNodeDebug = useCallback((el) => {
    if (!(el instanceof Element)) return null;
    return {
      tag: String(el.tagName || '').toLowerCase(),
      class: typeof el.className === 'string' ? el.className : null,
      dataset: el.dataset ? { ...el.dataset } : {},
    };
  }, []);

  const toAncestorDebug = useCallback((eventTarget, limit = 12) => {
    const chain = [];
    let cur = eventTarget instanceof Element ? eventTarget : null;
    while (cur && chain.length < limit) {
      chain.push(toNodeDebug(cur));
      cur = cur.parentElement;
    }
    return chain;
  }, [toNodeDebug]);

  const debugLogPick = useCallback((mode, picker, event, resolvedEl) => {
    if (!pickDebugEnabled) return;
    if (!isDevBuild) return;
    try {
      const target = event?.target instanceof Element ? event.target : null;
      const payload = {
        mode,
        picker,
        target: toNodeDebug(target),
        ancestors: toAncestorDebug(target, 12),
        resolved: toNodeDebug(resolvedEl),
        resolvedId: resolvedEl?.getAttribute?.('data-ui-id')
          || resolvedEl?.getAttribute?.('data-card-id')
          || null,
      };
      console.info(`[pick-debug] ${JSON.stringify(payload)}`);
    } catch (err) {
      console.info('[pick-debug] failed to log', err);
    }
  }, [isDevBuild, pickDebugEnabled, toAncestorDebug, toNodeDebug]);

  const stopPracticeButtonPickCaptureImmediate = useCallback(() => {
    const handler = practiceButtonPickHandlerRef.current;
    if (!handler) return;
    document.removeEventListener('click', handler, true);
    practiceButtonPickHandlerRef.current = null;
  }, []);

  const stopUniversalPickCaptureImmediate = useCallback(() => {
    const handler = universalPickHandlerRef.current;
    if (!handler) return;
    document.removeEventListener('click', handler, true);
    universalPickHandlerRef.current = null;
  }, []);

  const handleStartUniversalPickFlow = useCallback(() => {
    setPickMode(false);
    stopPracticeButtonPickCaptureImmediate();
    setPracticeButtonPickMode(false);
    setControlsSelectedId(null);
    setControlsSelectedRoleGroup(null);
    setControlsSurfaceIsRoot(false);
    setControlsSurfaceDebug(null);
    setPickDebugResolvedMode(null);
    setPickDebugResolvedId(null);
    setPlatesSelectedId(null);
    setUniversalPickMode(true);
  }, [setPickMode, stopPracticeButtonPickCaptureImmediate]);

  const handleStopUniversalPickFlow = useCallback(() => {
    setPickMode(false);
    setUniversalPickMode(false);
  }, [setPickMode]);

  const stopAllPickerFlows = useCallback(() => {
    setPickMode(false);
    stopPracticeButtonPickCaptureImmediate();
    setPracticeButtonPickMode(false);
    stopUniversalPickCaptureImmediate();
    setUniversalPickMode(false);
  }, [setPickMode, stopPracticeButtonPickCaptureImmediate, stopUniversalPickCaptureImmediate]);

  const broadcastPracticeButtonPicker = useCallback((next) => {
    if (typeof window === 'undefined') return;
    try {
      emitPickerSelection(PRACTICE_BUTTON_PICK_STORAGE_KEY, PRACTICE_BUTTON_PICK_EVENT, next);
    } catch {
      // ignore
    }
  }, [emitPickerSelection]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    try {
      const raw = window.localStorage.getItem(PICK_DEBUG_FLAG_KEY);
      if (raw === '1') queueMicrotask(() => setPickDebugEnabledLocal(true));
      if (raw === '0') queueMicrotask(() => setPickDebugEnabledLocal(false));
    } catch {
      // ignore
    }
    return undefined;
  }, [canRunDevEffects]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    try {
      window.localStorage.setItem(PICK_DEBUG_FLAG_KEY, pickDebugEnabled ? '1' : '0');
    } catch {
      // ignore
    }
    try {
      setPickDebugEnabled(Boolean(pickDebugEnabled));
    } catch {
      // ignore
    }
    return undefined;
  }, [canRunDevEffects, pickDebugEnabled, setPickDebugEnabled]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    try {
      const raw = window.localStorage.getItem(PRACTICE_BUTTON_PICK_STORAGE_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      queueMicrotask(() => {
        setPracticeButtonApplyToAll(parsed?.applyToAll !== false);
        setPracticeButtonSelectedKey(typeof parsed?.selectedKey === 'string' ? parsed.selectedKey : null);
      });
    } catch {
      // ignore
    }
    return undefined;
  }, [canRunDevEffects]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    try {
      const raw = window.localStorage.getItem(LEGACY_PICKERS_FLAG_KEY);
      if (raw === '0') queueMicrotask(() => setLegacyPickersEnabled(false));
      if (raw === '1') queueMicrotask(() => setLegacyPickersEnabled(true));
    } catch {
      // ignore
    }
    return undefined;
  }, [canRunDevEffects]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    try {
      window.localStorage.setItem(LEGACY_PICKERS_FLAG_KEY, legacyPickersEnabled ? '1' : '0');
    } catch {
      // ignore
    }
    return undefined;
  }, [canRunDevEffects, legacyPickersEnabled]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    if (legacyPickersEnabled) return undefined;
    setPickMode(false);
    stopPracticeButtonPickCaptureImmediate();
    queueMicrotask(() => setPracticeButtonPickMode(false));
    return undefined;
  }, [canRunDevEffects, legacyPickersEnabled, setPickMode, stopPracticeButtonPickCaptureImmediate]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    broadcastPracticeButtonPicker({
      applyToAll: practiceButtonApplyToAll,
      selectedKey: practiceButtonSelectedKey,
    });
    return undefined;
  }, [broadcastPracticeButtonPicker, canRunDevEffects, practiceButtonApplyToAll, practiceButtonSelectedKey]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    broadcastControlsPicker({ selectedId: controlsSelectedId || null });
    return undefined;
  }, [broadcastControlsPicker, canRunDevEffects, controlsSelectedId]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    queueMicrotask(() => setControlsFxDraft(getControlsFxPreset(controlsSelectedId)));
    return undefined;
  }, [canRunDevEffects, controlsSelectedId, getControlsFxPreset, setControlsFxDraft]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    if (!practiceButtonPickMode) return undefined;

    queueMicrotask(() => setPickMode(false));
    queueMicrotask(() => setUniversalPickMode(false));

    const normalizePracticeType = (raw) => {
      const t = String(raw || '').trim().toLowerCase();
      if (!t) return null;
      if (t === 'perception') return 'visual';
      if (t === 'resonance') return 'sound';
      return t;
    };

    const onClickCapture = (event) => {
      const target = event?.target instanceof Element ? event.target : null;
      if (!target) return;
      const el = target.closest('[data-ui="practice-button"]');
      debugLogPick('legacy:practice-button', 'legacy', event, el);
      setPickDebugResolvedMode('legacy:practice-button');
      setPickDebugResolvedId(null);
      if (!el) {
        logNearestAncestors('practice-button', target);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

      const practiceType = normalizePracticeType(el.getAttribute('data-practice-type'));
      const id = el.getAttribute('data-practice-id') || el.id || practiceType || 'practice';
      const key = `${practiceType || 'practice'}:${id}`;
      setPickDebugResolvedId(key);
      setPracticeButtonSelectedKey(key);
      setPracticeButtonApplyToAll(false);
    };

    stopPracticeButtonPickCaptureImmediate();
    practiceButtonPickHandlerRef.current = onClickCapture;
    document.addEventListener('click', onClickCapture, true);
    return () => {
      document.removeEventListener('click', onClickCapture, true);
      if (practiceButtonPickHandlerRef.current === onClickCapture) {
        practiceButtonPickHandlerRef.current = null;
      }
    };
  }, [
    canRunDevEffects,
    debugLogPick,
    logNearestAncestors,
    practiceButtonPickMode,
    setPickMode,
    stopPracticeButtonPickCaptureImmediate,
  ]);

  useEffect(() => {
    const removePlatesPickerClass = () => {
      try {
        document.body.classList.remove('dev-plates-picker-active');
      } catch {
        // ignore
      }
    };

    if (!isOpen || !devtoolsEnabled) {
      stopControlsPicking();
      detachControlsCapture();
      stopUniversalPickCaptureImmediate();
      removePlatesPickerClass();
      return undefined;
    }

    if (!universalPickMode) {
      stopControlsPicking();
      detachControlsCapture();
      stopUniversalPickCaptureImmediate();
      removePlatesPickerClass();
      return undefined;
    }

    queueMicrotask(() => setPickMode(false));
    stopPracticeButtonPickCaptureImmediate();
    queueMicrotask(() => setPracticeButtonPickMode(false));

    if (universalPickerKind === 'controls' || universalPickerKind === 'plates') {
      stopUniversalPickCaptureImmediate();
      attachControlsCapture();

      if (universalPickerKind === 'plates') {
        try {
          document.body.classList.add('dev-plates-picker-active');
        } catch {
          // ignore
        }
      } else {
        removePlatesPickerClass();
      }

      startControlsPicking({
        kind: universalPickerKind,
        onPick: ({ validation }) => {
          const resolvedId = validation?.rootId || null;
          if (!resolvedId) return;

          if (universalPickerKind === 'controls') {
            setPickDebugResolvedMode('universal:controls');
            setPickDebugResolvedId(resolvedId);
            setControlsSelectedId(resolvedId);
            setControlsSelectedRoleGroup(validation?.roleGroup || null);
            setControlsSurfaceIsRoot(Boolean(validation?.surfaceIsRoot));
            const surface = validation?.surfaceEl && typeof validation.surfaceEl.tagName === 'string' ? validation.surfaceEl : null;
            setControlsSurfaceDebug(surface ? {
              tag: String(surface.tagName || '').toLowerCase(),
              className: typeof surface.className === 'string' ? surface.className : null,
            } : null);
            return;
          }

          setPickDebugResolvedMode('universal:plates');
          setPickDebugResolvedId(resolvedId);
          setPlatesSelectedId(resolvedId);
          try {
            emitPickerSelection('immanence.dev.platesFxPicker', 'immanence-plates-fx-picker', { selectedId: resolvedId });
          } catch {
            // ignore
          }
        },
      });

      return () => {
        stopControlsPicking();
        detachControlsCapture();
        removePlatesPickerClass();
      };
    }

    if (universalPickerKind === 'card') {
      stopControlsPicking();
      detachControlsCapture();
      removePlatesPickerClass();
      stopUniversalPickCaptureImmediate();
      try {
        document.documentElement.classList.add('dev-card-picker-active');
      } catch {
        // ignore
      }

      const onClickCapture = (event) => {
        const target = event?.target instanceof Element ? event.target : null;
        if (!target) return;
        if (target.closest?.('[data-devpanel-root="true"]')) return;
        const el = findCardFromEvent(event);
        debugLogPick('universal:card', 'universal', event, el);
        setPickDebugResolvedMode('universal:card');
        setPickDebugResolvedId(el?.getAttribute?.('data-card-id') || null);
        if (!el) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        selectCard(el);
      };

      universalPickHandlerRef.current = onClickCapture;
      window.addEventListener('click', onClickCapture, true);
      return () => {
        window.removeEventListener('click', onClickCapture, true);
        if (universalPickHandlerRef.current === onClickCapture) {
          universalPickHandlerRef.current = null;
        }
        try {
          document.documentElement.classList.remove('dev-card-picker-active');
        } catch {
          // ignore
        }
      };
    }

    stopControlsPicking();
    detachControlsCapture();
    stopUniversalPickCaptureImmediate();
    removePlatesPickerClass();
    return undefined;
  }, [
    attachControlsCapture,
    debugLogPick,
    detachControlsCapture,
    devtoolsEnabled,
    emitPickerSelection,
    findCardFromEvent,
    isOpen,
    selectCard,
    setPickMode,
    startControlsPicking,
    stopControlsPicking,
    stopPracticeButtonPickCaptureImmediate,
    stopUniversalPickCaptureImmediate,
    universalPickMode,
    universalPickerKind,
  ]);

  useEffect(() => {
    if (!canRunDevEffects) return undefined;
    queueMicrotask(() => {
      setPlatesFxDraft(getPlatesFxPreset(platesSelectedId));
      setPlatesAdvancedOpen(false);
    });
    return undefined;
  }, [canRunDevEffects, getPlatesFxPreset, platesSelectedId, setPlatesAdvancedOpen, setPlatesFxDraft]);

  return {
    practiceButtonPickMode,
    setPracticeButtonPickMode,
    practiceButtonApplyToAll,
    setPracticeButtonApplyToAll,
    practiceButtonSelectedKey,
    legacyPickersEnabled,
    setLegacyPickersEnabled,
    pickDebugEnabled,
    setPickDebugEnabledLocal,
    universalPickerKind,
    setUniversalPickerKind,
    universalPickMode,
    setUniversalPickMode,
    controlsSelectedId,
    controlsSelectedRoleGroup,
    controlsSurfaceIsRoot,
    controlsSurfaceDebug,
    pickDebugResolvedMode,
    pickDebugResolvedId,
    platesSelectedId,
    stopPracticeButtonPickCaptureImmediate,
    stopUniversalPickCaptureImmediate,
    handleStartUniversalPickFlow,
    handleStopUniversalPickFlow,
    stopAllPickerFlows,
  };
}

export default useDevPanelPickers;
