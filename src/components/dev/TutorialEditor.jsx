// src/components/dev/TutorialEditor.jsx
import React, { useState, useEffect } from 'react';
import { TUTORIALS } from '../../tutorials/tutorialRegistry.js';

const STORAGE_KEY = 'immanence.tutorial.overrides';

// Validation helper
function validateTutorial(obj) {
  const errors = [];
  
  if (!obj || typeof obj !== 'object') {
    errors.push('Must be an object');
    return errors;
  }
  
  if (typeof obj.title !== 'string') {
    errors.push('Missing or invalid "title" (must be string)');
  }
  
  if (!Array.isArray(obj.steps)) {
    errors.push('Missing or invalid "steps" (must be array)');
    return errors;
  }
  
  obj.steps.forEach((step, i) => {
    if (typeof step.title !== 'string') {
      errors.push(`Step ${i + 1}: missing or invalid "title"`);
    }
    if (typeof step.body !== 'string') {
      errors.push(`Step ${i + 1}: missing or invalid "body"`);
    }
    if (step.placement && !['top', 'right', 'bottom', 'left', 'center'].includes(step.placement)) {
      errors.push(`Step ${i + 1}: invalid "placement" (must be top|right|bottom|left|center)`);
    }
    if (step.target !== null && typeof step.target !== 'string') {
      errors.push(`Step ${i + 1}: invalid "target" (must be null or string)`);
    }
  });
  
  return errors;
}

export function TutorialEditor() {
  const [selectedId, setSelectedId] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Load overrides from localStorage
  const loadOverrides = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  
  const [overrides, setOverrides] = useState(loadOverrides());
  
  // Get all available tutorialIds (registry + saved overrides)
  const allTutorialIds = Array.from(
    new Set([...Object.keys(TUTORIALS), ...Object.keys(overrides)])
  ).sort();
  
  // Load from registry
  const handleLoadRegistry = () => {
    if (!selectedId) return;
    const tut = TUTORIALS[selectedId];
    if (tut) {
      setJsonText(JSON.stringify(tut, null, 2));
      setValidationErrors([]);
      setStatusMessage('Loaded from registry');
    } else {
      setStatusMessage('Not found in registry');
    }
  };
  
  // Load from saved override
  const handleLoadOverride = () => {
    if (!selectedId) return;
    const tut = overrides[selectedId];
    if (tut) {
      setJsonText(JSON.stringify(tut, null, 2));
      setValidationErrors([]);
      setStatusMessage('Loaded saved override');
    } else {
      setStatusMessage('No saved override for this tutorial');
    }
  };
  
  // Validate JSON
  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const errors = validateTutorial(parsed);
      setValidationErrors(errors);
      if (errors.length === 0) {
        setStatusMessage('✓ Valid tutorial JSON');
      } else {
        setStatusMessage('');
      }
    } catch (err) {
      setValidationErrors([`JSON parse error: ${err.message}`]);
      setStatusMessage('');
    }
  };
  
  // Save override
  const handleSave = () => {
    if (!selectedId) {
      setStatusMessage('Select a tutorialId first');
      return;
    }
    
    try {
      const parsed = JSON.parse(jsonText);
      const errors = validateTutorial(parsed);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setStatusMessage('Cannot save: validation failed');
        return;
      }
      
      const newOverrides = { ...overrides, [selectedId]: parsed };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOverrides));
      setOverrides(newOverrides);
      setValidationErrors([]);
      setStatusMessage(`✓ Saved override for "${selectedId}"`);
      
      // Notify runtime to reload
      window.dispatchEvent(new CustomEvent('tutorial-override-changed'));
    } catch (err) {
      setValidationErrors([`Save failed: ${err.message}`]);
      setStatusMessage('');
    }
  };
  
  // Clear override
  const handleClear = () => {
    if (!selectedId) return;
    
    if (!overrides[selectedId]) {
      setStatusMessage('No override to clear');
      return;
    }
    
    const newOverrides = { ...overrides };
    delete newOverrides[selectedId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOverrides));
    setOverrides(newOverrides);
    setStatusMessage(`✓ Cleared override for "${selectedId}"`);
    
    // Notify runtime
    window.dispatchEvent(new CustomEvent('tutorial-override-changed'));
  };
  
  // Auto-load when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    
    // Defer state updates to avoid cascading render warning
    const timer = setTimeout(() => {
      // Prefer override if exists, else registry
      const tut = overrides[selectedId] || TUTORIALS[selectedId];
      if (tut) {
        setJsonText(JSON.stringify(tut, null, 2));
        setValidationErrors([]);
        setStatusMessage(overrides[selectedId] ? 'Loaded saved override' : 'Loaded from registry');
      } else {
        setStatusMessage('Not found');
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [selectedId, overrides]);
  
  return (
    <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-white/10">
      <div className="text-xs text-white/90 font-semibold mb-2">Tutorial Script Editor</div>
      
      {/* Tutorial ID selector */}
      <div>
        <label className="text-[10px] text-white/60 mb-1 block">Tutorial ID</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-xs text-white/90"
        >
          <option value="">-- Select tutorial --</option>
          {allTutorialIds.map((id) => (
            <option key={id} value={id}>
              {id} {overrides[id] ? '(override)' : ''}
            </option>
          ))}
        </select>
      </div>
      
      {/* JSON editor */}
      {selectedId && (
        <>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full h-64 px-3 py-2 rounded bg-black/60 border border-white/20 text-[11px] text-white/90 font-mono resize-y"
            placeholder="Tutorial JSON..."
            spellCheck={false}
          />
          
          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="text-[10px] text-red-400 space-y-1">
              {validationErrors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}
          
          {/* Status message */}
          {statusMessage && (
            <div className="text-[10px] text-green-400">{statusMessage}</div>
          )}
          
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleLoadRegistry}
              className="px-3 py-1.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              Load Registry
            </button>
            <button
              onClick={handleLoadOverride}
              className="px-3 py-1.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
            >
              Load Override
            </button>
            <button
              onClick={handleValidate}
              className="px-3 py-1.5 rounded text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors"
            >
              Validate JSON
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors"
            >
              Save Override
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors col-span-2"
            >
              Clear Override
            </button>
          </div>
        </>
      )}
    </div>
  );
}
