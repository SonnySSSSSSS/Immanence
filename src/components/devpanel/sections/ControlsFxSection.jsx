import FxTuningSection from "./FxTuningSection.jsx";

function ControlsFxSection({
  universalPickerKind,
  controlsSelectedId,
  controlsSelectedRoleGroup,
  controlsSurfaceIsRoot,
  controlsSurfaceDebug,
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
  utcViolations,
}) {
  if (universalPickerKind !== 'controls') return null;

  return (
    <>
      <div className="space-y-2 mb-3">
        <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
          Selected: {controlsSelectedId || 'none'}
        </div>
        <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
          Role group: {controlsSelectedRoleGroup || 'null'}
        </div>
        <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
          Surface: {controlsSelectedId ? (controlsSurfaceIsRoot ? 'root' : 'descendant') : 'n/a'}
        </div>
        <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
          Surface node: {controlsSurfaceDebug ? `${controlsSurfaceDebug.tag}${controlsSurfaceDebug.className ? `.${String(controlsSurfaceDebug.className).trim().split(/\s+/g).slice(0, 3).join('.')}` : ''}` : 'null'}
        </div>
      </div>

      <FxTuningSection
        controlsSelectedId={controlsSelectedId}
        controlsElectricBorderEnabled={controlsElectricBorderEnabled}
        setControlsElectricBorderEnabled={setControlsElectricBorderEnabled}
        controlsFxDraft={controlsFxDraft}
        setControlsFxDraft={setControlsFxDraft}
        setControlsFxPreset={setControlsFxPreset}
        resetControlsFxPreset={resetControlsFxPreset}
        getControlsFxPreset={getControlsFxPreset}
        controlsPresetJson={controlsPresetJson}
        setControlsPresetJson={setControlsPresetJson}
        controlsPresetStatus={controlsPresetStatus}
        setControlsPresetStatus={setControlsPresetStatus}
        exportControlsFxPresetsJson={exportControlsFxPresetsJson}
        importControlsFxPresetsJson={importControlsFxPresetsJson}
        resetAllControlsFxPresets={resetAllControlsFxPresets}
      />

      <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 mb-2">
        UTC Violations: {utcViolations.length}
      </div>
      {utcViolations.slice(0, 5).map((v) => (
        <div key={v.violationKey} className="text-[10px] mb-1 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-red-200/90">
          <div className="font-mono">{v.violationKey}</div>
          <div className="text-red-200/70">{v.reasons.join(', ')}</div>
        </div>
      ))}
    </>
  );
}

export default ControlsFxSection;
