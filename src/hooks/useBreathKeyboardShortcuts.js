// src/hooks/useBreathKeyboardShortcuts.js
// Keyboard shortcut handler for the breath practice preset switcher.
// Extracted from PracticeSection.jsx.
//
// F2             — toggle preset switcher open/closed
// ArrowLeft/Right — cycle ring presets (only when switcher is open)
// Escape          — close preset switcher

import { useEffect, useRef } from 'react';
import { BREATH_RING_PRESETS } from '../components/breathingRingPresets.js';

function isTypingIntoEditableElement(activeEl) {
  if (!activeEl) return false;
  const tagName = activeEl.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true;
  if (activeEl.isContentEditable) return true;
  return activeEl.getAttribute?.('contenteditable') === 'true';
}

/**
 * @param {object} params
 * @param {boolean} params.isBreathPractice       - Whether a breath practice is active
 * @param {boolean} params.isPresetSwitcherOpen   - Current open state of the preset switcher
 * @param {Function} params.setIsPresetSwitcherOpen
 * @param {Function} params.setRingPresetIndex
 */
export function useBreathKeyboardShortcuts({
  isBreathPractice,
  isPresetSwitcherOpen,
  setIsPresetSwitcherOpen,
  setRingPresetIndex,
}) {
  const isBreathPracticeRef = useRef(isBreathPractice);
  const isPresetSwitcherOpenRef = useRef(isPresetSwitcherOpen);

  useEffect(() => {
    isBreathPracticeRef.current = isBreathPractice;
  }, [isBreathPractice]);

  useEffect(() => {
    isPresetSwitcherOpenRef.current = isPresetSwitcherOpen;
  }, [isPresetSwitcherOpen]);

  // Close the preset switcher when switching away from breath practice
  useEffect(() => {
    if (isBreathPractice) return;
    setIsPresetSwitcherOpen(false);
  }, [isBreathPractice, setIsPresetSwitcherOpen]);

  // Keydown listener — uses refs to avoid stale closure captures
  useEffect(() => {
    const onWindowKeyDown = (event) => {
      const code = event.code;
      const key = event.key;
      const isF2 = code === 'F2' || key === 'F2';
      const isArrowLeft = code === 'ArrowLeft' || key === 'ArrowLeft';
      const isArrowRight = code === 'ArrowRight' || key === 'ArrowRight';
      const isEscape = code === 'Escape' || key === 'Escape';

      if (!(isF2 || isArrowLeft || isArrowRight || isEscape)) return;
      if (isTypingIntoEditableElement(document.activeElement)) return;
      if (!isBreathPracticeRef.current) return;

      if (isF2) {
        event.preventDefault();
        event.stopPropagation();
        setIsPresetSwitcherOpen((prev) => !prev);
        return;
      }

      if (!isPresetSwitcherOpenRef.current) return;

      if (isEscape) {
        event.preventDefault();
        event.stopPropagation();
        setIsPresetSwitcherOpen(false);
        return;
      }

      if (isArrowLeft) {
        event.preventDefault();
        event.stopPropagation();
        setRingPresetIndex((prev) => (prev - 1 + BREATH_RING_PRESETS.length) % BREATH_RING_PRESETS.length);
        return;
      }

      if (isArrowRight) {
        event.preventDefault();
        event.stopPropagation();
        setRingPresetIndex((prev) => (prev + 1) % BREATH_RING_PRESETS.length);
      }
    };

    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [setIsPresetSwitcherOpen, setRingPresetIndex]);
}
