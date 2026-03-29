import RangeControl from "../ui/RangeControl.jsx";

function FxTuningSection({
  controlsSelectedId,
  controlsElectricBorderEnabled,
  setControlsElectricBorderEnabled,
  controlsFxDraft,
  setControlsFxDraft,
  setControlsFxPreset,
  resetControlsFxPreset,
  getControlsFxPreset,
  controlsPresetJson,
  setControlsPresetJson,
  controlsPresetStatus,
  setControlsPresetStatus,
  exportControlsFxPresetsJson,
  importControlsFxPresetsJson,
  resetAllControlsFxPresets,
}) {
  return (
    <div className="border-t border-white/10 pt-3 mt-3 mb-3">
      <div className="text-[11px] text-white/80 font-semibold mb-2">FX: Selected Control Electric Border</div>
      <button
        onClick={() => setControlsElectricBorderEnabled(!controlsElectricBorderEnabled)}
        disabled={!controlsSelectedId}
        className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${controlsElectricBorderEnabled ? 'bg-amber-500/20 text-amber-200 border-amber-400/50' : 'bg-white/5 text-white/70 border-white/15'} ${!controlsSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {controlsElectricBorderEnabled ? 'Enable Selected Control FX: ON' : 'Enable Selected Control FX: OFF'}
      </button>
      <div className="text-[10px] text-white/45 mt-2">
        Target: current <span className="font-mono">data-ui-id</span> (role-scope)
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <RangeControl
          label="Thickness"
          value={controlsFxDraft.thickness}
          min={1}
          max={12}
          step={1}
          disabled={!controlsSelectedId}
          onChange={(v) => {
            const next = { ...controlsFxDraft, thickness: v };
            setControlsFxDraft(next);
            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { thickness: v });
          }}
        />
        <RangeControl
          label="Offset"
          value={controlsFxDraft.offsetPx}
          min={0}
          max={40}
          step={1}
          suffix="px"
          disabled={!controlsSelectedId}
          onChange={(v) => {
            const next = { ...controlsFxDraft, offsetPx: v };
            setControlsFxDraft(next);
            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { offsetPx: v });
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <RangeControl
          label="Speed"
          value={controlsFxDraft.speed}
          min={0}
          max={0.2}
          step={0.005}
          disabled={!controlsSelectedId}
          onChange={(v) => {
            const next = { ...controlsFxDraft, speed: v };
            setControlsFxDraft(next);
            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { speed: v });
          }}
        />
        <RangeControl
          label="Chaos"
          value={controlsFxDraft.chaos}
          min={0}
          max={0.3}
          step={0.005}
          disabled={!controlsSelectedId}
          onChange={(v) => {
            const next = { ...controlsFxDraft, chaos: v };
            setControlsFxDraft(next);
            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { chaos: v });
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <RangeControl
          label="Glow"
          value={controlsFxDraft.glow}
          min={0}
          max={64}
          step={1}
          suffix="px"
          disabled={!controlsSelectedId}
          onChange={(v) => {
            const next = { ...controlsFxDraft, glow: v };
            setControlsFxDraft(next);
            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { glow: v });
          }}
        />
        <RangeControl
          label="Blur"
          value={controlsFxDraft.blur}
          min={0}
          max={24}
          step={1}
          suffix="px"
          disabled={!controlsSelectedId}
          onChange={(v) => {
            const next = { ...controlsFxDraft, blur: v };
            setControlsFxDraft(next);
            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { blur: v });
          }}
        />
      </div>

      <div className="mt-2">
        <RangeControl
          label="Opacity"
          value={controlsFxDraft.opacity}
          min={0.1}
          max={1}
          step={0.01}
          disabled={!controlsSelectedId}
          onChange={(v) => {
            const next = { ...controlsFxDraft, opacity: v };
            setControlsFxDraft(next);
            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { opacity: v });
          }}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 items-center">
        <div className="text-[10px] text-white/55">Color</div>
        <div className="flex items-center justify-end gap-2">
          <input
            type="color"
            value={(typeof controlsFxDraft.color === 'string' && controlsFxDraft.color.startsWith('#')) ? controlsFxDraft.color : '#ffffff'}
            disabled={!controlsSelectedId}
            onChange={(e) => {
              const value = e?.target?.value || null;
              const next = { ...controlsFxDraft, color: value };
              setControlsFxDraft(next);
              if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { color: value });
            }}
            className="h-8 w-12 p-0 border border-white/15 rounded"
            style={{ background: 'transparent' }}
          />
          <button
            disabled={!controlsSelectedId}
            onClick={() => {
              const next = { ...controlsFxDraft, color: null };
              setControlsFxDraft(next);
              if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { color: null });
            }}
            className={`px-2 py-2 rounded-lg text-[10px] border transition-all ${!controlsSelectedId ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/35' : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'}`}
          >
            Use role color
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          disabled={!controlsSelectedId}
          onClick={() => {
            if (!controlsSelectedId) return;
            resetControlsFxPreset(controlsSelectedId);
            setControlsFxDraft(getControlsFxPreset(controlsSelectedId));
          }}
          className={`px-3 py-2 rounded-lg text-xs border transition-all ${!controlsSelectedId ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/35' : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'}`}
        >
          Reset Preset
        </button>
        <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
          Preset: {controlsSelectedId ? 'saved' : 'n/a'}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-white/55">Presets JSON</div>
      <textarea
        data-testid="controls-presets-json"
        value={controlsPresetJson}
        onChange={(e) => setControlsPresetJson(e?.target?.value || '')}
        className="w-full mt-1 rounded-lg border border-white/15 bg-white/5 text-white/80 p-2 text-[11px] font-mono"
        rows={5}
        placeholder='{"version":2,"presets":{"homeHub:mode:navigation":{"glow":24}}}'
      />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          data-testid="controls-presets-export"
          onClick={() => {
            const json = exportControlsFxPresetsJson();
            setControlsPresetJson(json);
            setControlsPresetStatus('Exported presets JSON.');
          }}
          className="px-3 py-2 rounded-lg text-xs border transition-all bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
        >
          Export Presets
        </button>
        <button
          data-testid="controls-presets-import"
          onClick={() => {
            const result = importControlsFxPresetsJson(controlsPresetJson, { replace: true });
            if (!result?.ok) {
              setControlsPresetStatus('Import failed: invalid JSON.');
              return;
            }
            setControlsFxDraft(getControlsFxPreset(controlsSelectedId));
            setControlsPresetStatus(`Imported ${result.count} preset(s).`);
          }}
          className="px-3 py-2 rounded-lg text-xs border transition-all bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
        >
          Import Presets
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          data-testid="controls-presets-reset-all"
          onClick={() => {
            resetAllControlsFxPresets();
            setControlsFxDraft(getControlsFxPreset(controlsSelectedId));
            setControlsPresetStatus('Reset all control presets.');
          }}
          className="px-3 py-2 rounded-lg text-xs border transition-all bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
        >
          Reset All Presets
        </button>
        <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
          {controlsPresetStatus || 'No preset action yet.'}
        </div>
      </div>
    </div>
  );
}

export default FxTuningSection;
