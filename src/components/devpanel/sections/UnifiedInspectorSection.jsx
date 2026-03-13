import Section from "../ui/Section.jsx";
import ControlsFxSection from "./ControlsFxSection.jsx";
import PlatesFxSection from "./PlatesFxSection.jsx";
import CardTunerSection from "./CardTunerSection.jsx";
import NavButtonTunerSection from "./NavButtonTunerSection.jsx";

function UnifiedInspectorSection({
  expanded,
  onToggle,
  isLight,
  devtoolsEnabled,
  universalPickerKind,
  setUniversalPickerKind,
  universalPickMode,
  handleStopUniversalPickFlow,
  handleStartUniversalPickFlow,
  legacyPickersEnabled,
  setLegacyPickersEnabled,
  pickDebugEnabled,
  setPickDebugEnabledLocal,
  uiTargetProbeEnabled,
  setUiTargetProbeEnabled,
  cardIdProbeEnabled,
  setCardIdProbeEnabled,
  pickDebugResolvedMode,
  pickDebugResolvedId,
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
  platesSelectedId,
  platesFxEnabled,
  setPlatesFxEnabled,
  platesFxDraft,
  patchSelectedPlatePreset,
  platesResolved,
  platesAdvancedOpen,
  setPlatesAdvancedOpen,
  activePlateOverrideCount,
  resetSelectedPlateOverrides,
  cardApplyToAll,
  setCardApplyToAll,
  cardState,
  activeDraft,
  selectedDisabled,
  onChangeCardSetting,
  cardTunerExpanded,
  onToggleCardTuner,
  cardElectricBorderEnabled,
  setCardElectricBorderEnabled,
  practiceButtonFxEnabled,
  setPracticeButtonFxEnabled,
  practiceButtonPickMode,
  setPracticeButtonPickMode,
  stopUniversalPickCaptureImmediate,
  setUniversalPickMode,
  setPickMode,
  practiceButtonApplyToAll,
  setPracticeButtonApplyToAll,
  practiceButtonSelectedKey,
  saveGlobal,
  globalDraft,
  saveSelected,
  selectedDraft,
  resetGlobal,
  resetSelected,
  clearAll,
  navBtnTunerExpanded,
  onToggleNavBtnTuner,
  navBtnProbeEnabled,
  setNavBtnProbeEnabled,
  navBtnState,
  setNavButtonTunerEnabled,
  navBtnDraft,
  onChangeNavBtnSetting,
  resetNavButtonSettings,
}) {
  return (
    <Section
      title="Inspector"
      expanded={expanded}
      onToggle={onToggle}
      isLight={isLight}
    >
      <div data-testid="devpanel-unified-inspector" className="space-y-3">
        {!devtoolsEnabled ? (
          <div className="text-xs text-white/50">Locked</div>
        ) : (
          <>
            <div className="text-[10px] text-white/50 mb-2">
              Universal picker: controls + plates + cards. Conflict rule: only one global capture listener active.
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                onClick={() => setUniversalPickerKind('controls')}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${universalPickerKind === 'controls' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
              >
                Controls
              </button>
              <button
                onClick={() => setUniversalPickerKind('card')}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${universalPickerKind === 'card' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setUniversalPickerKind('plates')}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${universalPickerKind === 'plates' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
              >
                Plates
              </button>
            </div>

            <button
              onClick={() => (universalPickMode ? handleStopUniversalPickFlow() : handleStartUniversalPickFlow())}
              className={`w-full mb-3 px-3 py-2 rounded-lg text-xs border transition-all ${universalPickMode ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
            >
              {universalPickMode ? 'Stop Picking' : 'Pick Target'}
            </button>

            <button
              onClick={() => setLegacyPickersEnabled(v => !v)}
              className={`w-full mb-3 px-3 py-2 rounded-lg text-xs border transition-all ${legacyPickersEnabled ? 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10' : 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/60'}`}
            >
              {legacyPickersEnabled ? 'Legacy pickers: ON' : 'Legacy pickers: OFF'}
            </button>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => setPickDebugEnabledLocal(v => !v)}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${pickDebugEnabled ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
              >
                Pick Debug {pickDebugEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setUiTargetProbeEnabled(v => !v)}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${uiTargetProbeEnabled ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
              >
                Probe: Targets
              </button>
              <button
                onClick={() => setCardIdProbeEnabled(v => !v)}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${cardIdProbeEnabled ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50' : 'bg-white/5 text-white/70 border-white/15'}`}
              >
                Probe: Cards
              </button>
            </div>

            <div className="mb-3 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              Debug resolved: {pickDebugResolvedMode ? `${pickDebugResolvedMode} → ${pickDebugResolvedId || 'null'}` : 'none'}
            </div>

            <ControlsFxSection
              universalPickerKind={universalPickerKind}
              controlsSelectedId={controlsSelectedId}
              controlsSelectedRoleGroup={controlsSelectedRoleGroup}
              controlsSurfaceIsRoot={controlsSurfaceIsRoot}
              controlsSurfaceDebug={controlsSurfaceDebug}
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
              utcViolations={utcViolations}
            />

            <PlatesFxSection
              universalPickerKind={universalPickerKind}
              platesSelectedId={platesSelectedId}
              platesFxEnabled={platesFxEnabled}
              setPlatesFxEnabled={setPlatesFxEnabled}
              platesFxDraft={platesFxDraft}
              patchSelectedPlatePreset={patchSelectedPlatePreset}
              platesResolved={platesResolved}
              platesAdvancedOpen={platesAdvancedOpen}
              setPlatesAdvancedOpen={setPlatesAdvancedOpen}
              activePlateOverrideCount={activePlateOverrideCount}
              resetSelectedPlateOverrides={resetSelectedPlateOverrides}
            />

            {universalPickerKind === 'card' && (
              <div className="text-[10px] text-white/45 mb-2">
                Card styling and Practice Button FX are below.
              </div>
            )}
            <div className="text-[10px] text-white/45 mb-2">
              Nav Button FX is below.
            </div>
          </>
        )}

        <CardTunerSection
          expanded={cardTunerExpanded}
          onToggle={onToggleCardTuner}
          isLight={isLight}
          devtoolsEnabled={devtoolsEnabled}
          legacyPickersEnabled={legacyPickersEnabled}
          cardState={cardState}
          cardApplyToAll={cardApplyToAll}
          setCardApplyToAll={setCardApplyToAll}
          activeDraft={activeDraft}
          selectedDisabled={selectedDisabled}
          onChangeCardSetting={onChangeCardSetting}
          cardElectricBorderEnabled={cardElectricBorderEnabled}
          setCardElectricBorderEnabled={setCardElectricBorderEnabled}
          practiceButtonFxEnabled={practiceButtonFxEnabled}
          setPracticeButtonFxEnabled={setPracticeButtonFxEnabled}
          practiceButtonPickMode={practiceButtonPickMode}
          setPracticeButtonPickMode={setPracticeButtonPickMode}
          stopUniversalPickCaptureImmediate={stopUniversalPickCaptureImmediate}
          setUniversalPickMode={setUniversalPickMode}
          setPickMode={setPickMode}
          practiceButtonApplyToAll={practiceButtonApplyToAll}
          setPracticeButtonApplyToAll={setPracticeButtonApplyToAll}
          practiceButtonSelectedKey={practiceButtonSelectedKey}
          saveGlobal={saveGlobal}
          globalDraft={globalDraft}
          saveSelected={saveSelected}
          selectedDraft={selectedDraft}
          resetGlobal={resetGlobal}
          resetSelected={resetSelected}
          clearAll={clearAll}
        />

        <NavButtonTunerSection
          expanded={navBtnTunerExpanded}
          onToggle={onToggleNavBtnTuner}
          isLight={isLight}
          devtoolsEnabled={devtoolsEnabled}
          navBtnProbeEnabled={navBtnProbeEnabled}
          setNavBtnProbeEnabled={setNavBtnProbeEnabled}
          navBtnState={navBtnState}
          setNavButtonTunerEnabled={setNavButtonTunerEnabled}
          navBtnDraft={navBtnDraft}
          onChangeNavBtnSetting={onChangeNavBtnSetting}
          resetNavButtonSettings={resetNavButtonSettings}
        />
      </div>
    </Section>
  );
}

export default UnifiedInspectorSection;
