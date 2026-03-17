import React, { useState, useEffect } from 'react';
import { TUTORIALS } from '../../tutorials/tutorialRegistry.js';
import { TUTORIAL_OVERRIDE_STORAGE_KEY } from '../../tutorials/tutorialRuntime.js';
import { validateTutorialDefinition } from '../../tutorials/tutorialSchema.js';
import {
  ONBOARDING_CONTENT_CHANGE_EVENT,
  ONBOARDING_CURRICULUM_STEP_OPTIONS,
  ONBOARDING_SPACING_OPTIONS,
  createDefaultOnboardingCurriculumContent,
  readOnboardingCurriculumContent,
  resetOnboardingCurriculumContent,
  writeOnboardingCurriculumContent,
} from '../../data/onboardingCurriculumContent.js';

const STORAGE_KEY = TUTORIAL_OVERRIDE_STORAGE_KEY;

const TUTORIAL_IMAGE_CHOICES = [
  { key: 'tutorial/breath and stillness/breath tutorial 1.webp', label: 'Breath Tutorial 1' },
  { key: 'tutorial/breath and stillness/breath tutorial 2.webp', label: 'Breath Tutorial 2' },
  { key: 'tutorial/breath and stillness/intensity 1.webp', label: 'Intensity 1' },
  { key: 'tutorial/breath and stillness/intensity 2.webp', label: 'Intensity 2' },
];

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function isSameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function DefaultValueNote({ value }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="text-[9px] text-white/35 mt-1">
      Default: {value === '' ? 'empty' : String(value)}
    </div>
  );
}

function EditorTextField({
  label,
  value,
  defaultValue,
  onChange,
  multiline = false,
  rows = 2,
  placeholder = '',
}) {
  return (
    <div>
      <label className="text-[10px] text-white/60 mb-1 block">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-[11px] text-white/90 resize-y"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-[11px] text-white/90"
          placeholder={placeholder}
        />
      )}
      <DefaultValueNote value={defaultValue} />
    </div>
  );
}

function EditorStringList({
  label,
  items,
  defaultItems,
  onChange,
  itemLabel,
  addLabel,
  placeholder,
}) {
  const currentItems = Array.isArray(items) ? items : [];
  const baselineItems = Array.isArray(defaultItems) ? defaultItems : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-white/60">{label}</div>
        <button
          type="button"
          onClick={() => onChange([...currentItems, ''])}
          className="px-2 py-1 rounded text-[10px] bg-white/10 text-white/70 border border-white/10 hover:bg-white/15"
        >
          {addLabel}
        </button>
      </div>
      {currentItems.map((item, index) => (
        <div key={`${label}-${index}`} className="rounded border border-white/10 bg-black/20 p-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] text-white/50">{itemLabel} {index + 1}</div>
            <button
              type="button"
              onClick={() => onChange(currentItems.filter((_, itemIndex) => itemIndex !== index))}
              className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/20"
            >
              Remove
            </button>
          </div>
          <textarea
            value={item}
            rows={2}
            onChange={(e) => onChange(currentItems.map((entry, itemIndex) => itemIndex === index ? e.target.value : entry))}
            className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-[11px] text-white/90 resize-y"
            placeholder={placeholder}
          />
          <DefaultValueNote value={baselineItems[index]} />
        </div>
      ))}
    </div>
  );
}

function EditorSpacingFields({ spacing, defaultSpacing, onChange }) {
  return (
    <div className="space-y-2 rounded border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/50">Spacing Tokens</div>
      {Object.keys(spacing || {}).map((key) => (
        <div key={key}>
          <label className="text-[10px] text-white/60 mb-1 block">{key}</label>
          <select
            value={spacing[key] || 'normal'}
            onChange={(e) => onChange({ ...spacing, [key]: e.target.value })}
            className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-[11px] text-white/90"
          >
            {ONBOARDING_SPACING_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <DefaultValueNote value={defaultSpacing?.[key]} />
        </div>
      ))}
    </div>
  );
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
      const errors = validateTutorialDefinition(selectedId || 'tutorial', parsed);
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
      const errors = validateTutorialDefinition(selectedId || 'tutorial', parsed);
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

          {/* Media helper section */}
          <div className="text-[10px] text-white/60 space-y-2 bg-black/30 p-2 rounded border border-white/10">
            <div className="font-semibold">📸 Tutorial Media Examples:</div>
            <div className="grid grid-cols-3 gap-1">
              {TUTORIAL_IMAGE_CHOICES.map((img) => (
                <div key={img.key} className="text-[9px] bg-black/50 p-1 rounded">
                  {img.label}
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="font-semibold">Media JSON format (add to step):</div>
              <code className="block text-[9px] whitespace-pre-wrap break-words bg-black/50 p-1 rounded mt-1">
{`"media": [{
  "src": "tutorial/breath and stillness/intensity 1.webp",
  "alt": "Breath practice diagram",
  "caption": "Optional caption"
}]`}
              </code>
            </div>
          </div>

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

function WelcomeStepEditor({ step, defaults, updateStep }) {
  return (
    <div className="space-y-3">
      <EditorTextField label="Title" value={step.title} defaultValue={defaults.title} onChange={(value) => updateStep((draft) => { draft.title = value; return draft; })} />
      <EditorTextField label="Intro" value={step.intro} defaultValue={defaults.intro} onChange={(value) => updateStep((draft) => { draft.intro = value; return draft; })} multiline />
      <EditorStringList label="Hero Paragraphs" items={step.paragraphs} defaultItems={defaults.paragraphs} onChange={(value) => updateStep((draft) => { draft.paragraphs = value; return draft; })} itemLabel="Paragraph" addLabel="Add Paragraph" placeholder="Paragraph text" />
      <EditorTextField label="Contract Meaning Title" value={step.contractMeaning.title} defaultValue={defaults.contractMeaning.title} onChange={(value) => updateStep((draft) => { draft.contractMeaning.title = value; return draft; })} />
      <EditorStringList label="Contract Meaning Paragraphs" items={step.contractMeaning.paragraphs} defaultItems={defaults.contractMeaning.paragraphs} onChange={(value) => updateStep((draft) => { draft.contractMeaning.paragraphs = value; return draft; })} itemLabel="Paragraph" addLabel="Add Paragraph" placeholder="Contract explanation" />
      <EditorTextField label="Daily Structure Title" value={step.dailyStructure.title} defaultValue={defaults.dailyStructure.title} onChange={(value) => updateStep((draft) => { draft.dailyStructure.title = value; return draft; })} />
      <div className="space-y-2">
        <div className="text-[10px] text-white/60">Daily Structure Items</div>
        {step.dailyStructure.items.map((item, index) => (
          <div key={`daily-structure-${index}`} className="rounded border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-white/50">Item {index + 1}</div>
              <button type="button" onClick={() => updateStep((draft) => { draft.dailyStructure.items = draft.dailyStructure.items.filter((_, itemIndex) => itemIndex !== index); return draft; })} className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/20">
                Remove
              </button>
            </div>
            <EditorTextField label="Label" value={item.label} defaultValue={defaults.dailyStructure.items[index]?.label} onChange={(value) => updateStep((draft) => { draft.dailyStructure.items[index].label = value; return draft; })} />
            <EditorTextField label="Description" value={item.description} defaultValue={defaults.dailyStructure.items[index]?.description} onChange={(value) => updateStep((draft) => { draft.dailyStructure.items[index].description = value; return draft; })} />
          </div>
        ))}
        <button type="button" onClick={() => updateStep((draft) => { draft.dailyStructure.items.push({ label: '', description: '' }); return draft; })} className="px-2 py-1 rounded text-[10px] bg-white/10 text-white/70 border border-white/10 hover:bg-white/15">
          Add Daily Structure Item
        </button>
      </div>
      <EditorTextField label="Training Focus Title" value={step.trainingFocus.title} defaultValue={defaults.trainingFocus.title} onChange={(value) => updateStep((draft) => { draft.trainingFocus.title = value; return draft; })} />
      <EditorStringList label="Training Focus Bullets" items={step.trainingFocus.bulletItems} defaultItems={defaults.trainingFocus.bulletItems} onChange={(value) => updateStep((draft) => { draft.trainingFocus.bulletItems = value; return draft; })} itemLabel="Bullet" addLabel="Add Bullet" placeholder="Bullet text" />
      <EditorTextField label="Closing Callout" value={step.calloutText} defaultValue={defaults.calloutText} onChange={(value) => updateStep((draft) => { draft.calloutText = value; return draft; })} multiline />
      <EditorSpacingFields spacing={step.spacing} defaultSpacing={defaults.spacing} onChange={(value) => updateStep((draft) => { draft.spacing = value; return draft; })} />
    </div>
  );
}

function CurriculumOverviewEditor({ step, defaults, updateStep }) {
  return (
    <div className="space-y-3">
      <EditorTextField label="Title" value={step.title} defaultValue={defaults.title} onChange={(value) => updateStep((draft) => { draft.title = value; return draft; })} />
      <div className="space-y-2">
        <div className="text-[10px] text-white/60">Week Cards</div>
        {step.weekCards.map((card, index) => (
          <div key={`week-card-${index}`} className="rounded border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-white/50">Card {index + 1}</div>
              <button type="button" onClick={() => updateStep((draft) => { draft.weekCards = draft.weekCards.filter((_, cardIndex) => cardIndex !== index); return draft; })} className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/20">
                Remove
              </button>
            </div>
            <EditorTextField label="Title" value={card.title} defaultValue={defaults.weekCards[index]?.title} onChange={(value) => updateStep((draft) => { draft.weekCards[index].title = value; return draft; })} />
            <EditorTextField label="Description" value={card.description} defaultValue={defaults.weekCards[index]?.description} onChange={(value) => updateStep((draft) => { draft.weekCards[index].description = value; return draft; })} multiline />
          </div>
        ))}
        <button type="button" onClick={() => updateStep((draft) => { draft.weekCards.push({ title: '', description: '' }); return draft; })} className="px-2 py-1 rounded text-[10px] bg-white/10 text-white/70 border border-white/10 hover:bg-white/15">
          Add Week Card
        </button>
      </div>
      <EditorStringList label="Summary Paragraphs" items={step.paragraphs} defaultItems={defaults.paragraphs} onChange={(value) => updateStep((draft) => { draft.paragraphs = value; return draft; })} itemLabel="Paragraph" addLabel="Add Paragraph" placeholder="Summary text" />
      <EditorSpacingFields spacing={step.spacing} defaultSpacing={defaults.spacing} onChange={(value) => updateStep((draft) => { draft.spacing = value; return draft; })} />
    </div>
  );
}

function PostureGuidanceEditor({ step, defaults, updateStep }) {
  return (
    <div className="space-y-3">
      <EditorTextField label="Title" value={step.title} defaultValue={defaults.title} onChange={(value) => updateStep((draft) => { draft.title = value; return draft; })} />
      <EditorTextField label="Intro" value={step.intro} defaultValue={defaults.intro} onChange={(value) => updateStep((draft) => { draft.intro = value; return draft; })} multiline />
      <div className="space-y-2">
        <div className="text-[10px] text-white/60">Posture Image Cards</div>
        {step.imageCards.map((card, index) => (
          <div key={card.src} className="rounded border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="text-[10px] text-white/40">Asset: {card.src}</div>
            <EditorTextField label="Label" value={card.label} defaultValue={defaults.imageCards[index]?.label} onChange={(value) => updateStep((draft) => { draft.imageCards[index].label = value; return draft; })} placeholder="Optional short label" />
            <EditorTextField label="Caption" value={card.caption} defaultValue={defaults.imageCards[index]?.caption} onChange={(value) => updateStep((draft) => { draft.imageCards[index].caption = value; return draft; })} multiline />
          </div>
        ))}
      </div>
      <EditorTextField label="Guidance Section Title" value={step.guidanceTitle} defaultValue={defaults.guidanceTitle} onChange={(value) => updateStep((draft) => { draft.guidanceTitle = value; return draft; })} />
      <EditorStringList label="Guidance Paragraphs" items={step.guidanceParagraphs} defaultItems={defaults.guidanceParagraphs} onChange={(value) => updateStep((draft) => { draft.guidanceParagraphs = value; return draft; })} itemLabel="Paragraph" addLabel="Add Paragraph" placeholder="Guidance text" />
      <EditorSpacingFields spacing={step.spacing} defaultSpacing={defaults.spacing} onChange={(value) => updateStep((draft) => { draft.spacing = value; return draft; })} />
    </div>
  );
}

function FocusIntensityEditor({ step, defaults, updateStep }) {
  return (
    <div className="space-y-3">
      <EditorTextField label="Title" value={step.title} defaultValue={defaults.title} onChange={(value) => updateStep((draft) => { draft.title = value; return draft; })} />
      <EditorTextField label="Intro" value={step.intro} defaultValue={defaults.intro} onChange={(value) => updateStep((draft) => { draft.intro = value; return draft; })} multiline />
      <EditorTextField label="Interval Section Title" value={step.intervalTitle} defaultValue={defaults.intervalTitle} onChange={(value) => updateStep((draft) => { draft.intervalTitle = value; return draft; })} />
      <EditorStringList label="Interval Paragraphs" items={step.intervalParagraphs} defaultItems={defaults.intervalParagraphs} onChange={(value) => updateStep((draft) => { draft.intervalParagraphs = value; return draft; })} itemLabel="Paragraph" addLabel="Add Paragraph" placeholder="Interval explanation" />
      <div className="space-y-2">
        <div className="text-[10px] text-white/60">Focus Image Cards</div>
        {step.imageCards.map((card, index) => (
          <div key={card.src} className="rounded border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="text-[10px] text-white/40">Asset: {card.src}</div>
            <EditorTextField label="Label" value={card.label} defaultValue={defaults.imageCards[index]?.label} onChange={(value) => updateStep((draft) => { draft.imageCards[index].label = value; return draft; })} />
            <EditorTextField label="Caption" value={card.caption} defaultValue={defaults.imageCards[index]?.caption} onChange={(value) => updateStep((draft) => { draft.imageCards[index].caption = value; return draft; })} multiline />
            <EditorTextField label="Description" value={card.description} defaultValue={defaults.imageCards[index]?.description} onChange={(value) => updateStep((draft) => { draft.imageCards[index].description = value; return draft; })} multiline />
          </div>
        ))}
      </div>
      <EditorTextField label="Meaning Section Title" value={step.meaningTitle} defaultValue={defaults.meaningTitle} onChange={(value) => updateStep((draft) => { draft.meaningTitle = value; return draft; })} />
      <EditorStringList label="Meaning Paragraphs" items={step.meaningParagraphs} defaultItems={defaults.meaningParagraphs} onChange={(value) => updateStep((draft) => { draft.meaningParagraphs = value; return draft; })} itemLabel="Paragraph" addLabel="Add Paragraph" placeholder="Meaning explanation" />
      <EditorSpacingFields spacing={step.spacing} defaultSpacing={defaults.spacing} onChange={(value) => updateStep((draft) => { draft.spacing = value; return draft; })} />
    </div>
  );
}

function ConfirmStepEditor({ step, defaults, updateStep }) {
  return (
    <div className="space-y-3">
      <EditorTextField label="Title" value={step.title} defaultValue={defaults.title} onChange={(value) => updateStep((draft) => { draft.title = value; return draft; })} />
      <EditorTextField label="Intro Prefix" value={step.introPrefix} defaultValue={defaults.introPrefix} onChange={(value) => updateStep((draft) => { draft.introPrefix = value; return draft; })} />
      <EditorTextField label="Intro Suffix" value={step.introSuffix} defaultValue={defaults.introSuffix} onChange={(value) => updateStep((draft) => { draft.introSuffix = value; return draft; })} />
      <EditorTextField label="Days Label" value={step.daysLabel} defaultValue={defaults.daysLabel} onChange={(value) => updateStep((draft) => { draft.daysLabel = value; return draft; })} />
      <EditorTextField label="Times Label" value={step.timesLabel} defaultValue={defaults.timesLabel} onChange={(value) => updateStep((draft) => { draft.timesLabel = value; return draft; })} />
      <EditorTextField label="Credit Note" value={step.creditNote} defaultValue={defaults.creditNote} onChange={(value) => updateStep((draft) => { draft.creditNote = value; return draft; })} multiline />
      <EditorTextField label="Benchmark Warning" value={step.benchmarkWarning} defaultValue={defaults.benchmarkWarning} onChange={(value) => updateStep((draft) => { draft.benchmarkWarning = value; return draft; })} multiline />
      <EditorTextField label="Closing Text" value={step.closingText} defaultValue={defaults.closingText} onChange={(value) => updateStep((draft) => { draft.closingText = value; return draft; })} multiline />
      <EditorSpacingFields spacing={step.spacing} defaultSpacing={defaults.spacing} onChange={(value) => updateStep((draft) => { draft.spacing = value; return draft; })} />
    </div>
  );
}

export function OnboardingContentEditor() {
  const defaults = createDefaultOnboardingCurriculumContent();
  const [selectedStepKey, setSelectedStepKey] = useState(ONBOARDING_CURRICULUM_STEP_OPTIONS[0]?.key || 'welcome');
  const [content, setContent] = useState(() => readOnboardingCurriculumContent());
  const [statusMessage, setStatusMessage] = useState('Live preview is active. Changes persist in localStorage.');

  useEffect(() => {
    const sync = () => {
      setContent(readOnboardingCurriculumContent());
    };

    window.addEventListener(ONBOARDING_CONTENT_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ONBOARDING_CONTENT_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const updateContent = (buildNext) => {
    setContent((prev) => {
      const next = buildNext(cloneValue(prev));
      writeOnboardingCurriculumContent(next);
      return next;
    });
  };

  const updateSelectedStep = (mutateStep) => {
    updateContent((draftContent) => {
      const stepDraft = cloneValue(draftContent[selectedStepKey]);
      draftContent[selectedStepKey] = mutateStep(stepDraft);
      return draftContent;
    });
  };

  const resetSelectedStep = () => {
    updateContent((draftContent) => {
      draftContent[selectedStepKey] = cloneValue(defaults[selectedStepKey]);
      return draftContent;
    });
    setStatusMessage(`Reset ${selectedStepKey} to defaults.`);
  };

  const resetAllSteps = () => {
    const resetContent = resetOnboardingCurriculumContent();
    setContent(resetContent);
    setStatusMessage('Reset all onboarding content to defaults.');
  };

  const currentStep = content[selectedStepKey];
  const defaultStep = defaults[selectedStepKey];
  const hasStepOverride = !isSameValue(currentStep, defaultStep);

  return (
    <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-white/90 font-semibold">Onboarding Content Editor</div>
          <div className="text-[10px] text-white/45 mt-1">Structured fields only. Defaults are shown below each control.</div>
        </div>
        <div className={`text-[10px] px-2 py-1 rounded border ${hasStepOverride ? 'bg-amber-500/15 text-amber-200 border-amber-500/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
          {hasStepOverride ? 'Edited values' : 'Using defaults'}
        </div>
      </div>

      <div className="text-[10px] text-white/45 rounded border border-white/10 bg-black/20 px-3 py-2">
        Live preview uses the real onboarding renderer path. Reset buttons remove only local overrides.
      </div>

      <div>
        <label className="text-[10px] text-white/60 mb-1 block">Onboarding Step</label>
        <select value={selectedStepKey} onChange={(e) => setSelectedStepKey(e.target.value)} className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-xs text-white/90">
          {ONBOARDING_CURRICULUM_STEP_OPTIONS.map((stepOption) => {
            const edited = !isSameValue(content[stepOption.key], defaults[stepOption.key]);
            return (
              <option key={stepOption.key} value={stepOption.key}>
                {stepOption.label} {edited ? '(edited)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={resetSelectedStep} className="px-3 py-1.5 rounded text-[10px] bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">
          Reset Step
        </button>
        <button type="button" onClick={resetAllSteps} className="px-3 py-1.5 rounded text-[10px] bg-red-500/15 text-red-200 border border-red-500/30 hover:bg-red-500/20 transition-colors">
          Reset All
        </button>
      </div>

      {selectedStepKey === 'welcome' && <WelcomeStepEditor step={currentStep} defaults={defaultStep} updateStep={updateSelectedStep} />}
      {selectedStepKey === 'curriculumOverview' && <CurriculumOverviewEditor step={currentStep} defaults={defaultStep} updateStep={updateSelectedStep} />}
      {selectedStepKey === 'postureGuidance' && <PostureGuidanceEditor step={currentStep} defaults={defaultStep} updateStep={updateSelectedStep} />}
      {selectedStepKey === 'stillnessFocusIntensity' && <FocusIntensityEditor step={currentStep} defaults={defaultStep} updateStep={updateSelectedStep} />}
      {selectedStepKey === 'confirm' && <ConfirmStepEditor step={currentStep} defaults={defaultStep} updateStep={updateSelectedStep} />}

      {statusMessage && <div className="text-[10px] text-green-400">{statusMessage}</div>}
    </div>
  );
}
