import Section from "../ui/Section.jsx";
import RangeControl from "../ui/RangeControl.jsx";
import DevButton from "../ui/DevButton.jsx";

function CardTunerSection({
  expanded,
  onToggle,
  isLight,
  devtoolsEnabled,
  legacyPickersEnabled,
  cardState,
  handleStopPickFlow,
  handleStartPickFlow,
  cardApplyToAll,
  setCardApplyToAll,
  handleTogglePeek,
  handleConfirmPickFlow,
  activeDraft,
  selectedDisabled,
  onChangeCardSetting,
  cardElectricBorderEnabled,
  setCardElectricBorderEnabled,
  practiceButtonFxEnabled,
  setPracticeButtonFxEnabled,
  practiceButtonPickMode,
  setPracticeButtonPickMode,
  stopUniversalPickCaptureImmediate,
  setUniversalPickMode,
  setPickMode,
  setPeekMode,
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
}) {
  return (
    <Section
      title="Card Styling Tuner"
      expanded={expanded}
      onToggle={onToggle}
      isLight={isLight}
    >
      {!devtoolsEnabled ? (
        <div className="text-xs text-white/50">Locked</div>
      ) : (
        <>
          <div className="text-[10px] text-white/50 mb-2">
            Pick a <span className="font-mono">data-card="true"</span> target and tune vars live.
          </div>
          {!legacyPickersEnabled && (
            <div className="text-[10px] text-white/45 mb-2">
              Legacy pick controls hidden. Use <span className="font-mono">Inspector (NEW)</span> to pick targets.
            </div>
          )}
          <div className={`grid ${legacyPickersEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-3`}>
            {legacyPickersEnabled && (
              <button
                onClick={() => (cardState.pickMode ? handleStopPickFlow() : handleStartPickFlow())}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${cardState.pickMode ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
              >
                {cardState.pickMode ? 'Stop Picking' : 'Pick Card'}
              </button>
            )}
            <button
              onClick={() => setCardApplyToAll(v => !v)}
              className={`px-3 py-2 rounded-lg text-xs border transition-all ${cardApplyToAll ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
            >
              {cardApplyToAll ? 'Apply to all: ON' : 'Apply to all: OFF'}
            </button>
          </div>
          {legacyPickersEnabled && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={handleTogglePeek}
                className="rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all"
              >
                Peek UI
              </button>
              <button
                onClick={handleConfirmPickFlow}
                disabled={!cardState.pickMode}
                className={`rounded-lg px-3 py-2 text-xs transition-all ${cardState.pickMode
                  ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                  : 'bg-white/5 border border-white/10 text-white/35 cursor-not-allowed'
                  }`}
              >
                Confirm Pick
              </button>
            </div>
          )}
          <div className="mb-3 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            Selected: {cardState.hasSelected ? (cardState.selectedCardId || cardState.selectedLabel || 'card') : 'none'}
          </div>
          <div className="text-[10px] text-white/50 mb-3">
            Quick peek shortcut: <span className="font-mono text-white/80">Ctrl+Alt+Shift+K</span>
          </div>

          <div className="space-y-2 mb-3">
            <RangeControl label="Tint H" value={activeDraft.cardTintH} min={0} max={360} step={1} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintH', v)} />
            <RangeControl label="Tint S" value={activeDraft.cardTintS} min={0} max={100} step={1} suffix="%" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintS', v)} />
            <RangeControl label="Tint L" value={activeDraft.cardTintL} min={0} max={100} step={1} suffix="%" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintL', v)} />
            <RangeControl label="Alpha" value={activeDraft.cardAlpha} min={0} max={1} step={0.01} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardAlpha', v)} />
            <RangeControl label="Border A" value={activeDraft.cardBorderAlpha} min={0} max={1} step={0.01} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardBorderAlpha', v)} />
            <RangeControl label="Blur" value={activeDraft.cardBlur} min={0} max={60} step={1} suffix="px" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardBlur', v)} />
          </div>

          <div className="border-t border-white/10 pt-3 mt-3 mb-3">
            <div className="text-[11px] text-white/80 font-semibold mb-2">FX: Selected Card Electric Border</div>
            <button
              onClick={() => setCardElectricBorderEnabled(!cardElectricBorderEnabled)}
              disabled={!cardState.hasSelected}
              className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${cardElectricBorderEnabled ? 'bg-amber-500/20 text-amber-200 border-amber-400/50' : 'bg-white/5 text-white/70 border-white/15'} ${!cardState.hasSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cardElectricBorderEnabled ? 'Enable Selected Card FX: ON' : 'Enable Selected Card FX: OFF'}
            </button>
            <div className="text-[10px] text-white/45 mt-2">
              Target: current <span className="font-mono">selectedCardId</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 mt-3 mb-3">
            <div className="text-[11px] text-white/80 font-semibold mb-2">FX: Practice Button Electric Border</div>
            <button
              onClick={() => setPracticeButtonFxEnabled(!practiceButtonFxEnabled)}
              className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${practiceButtonFxEnabled ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50' : 'bg-white/5 text-white/70 border-white/15'}`}
            >
              {practiceButtonFxEnabled ? 'Enable Practice Button FX: ON' : 'Enable Practice Button FX: OFF'}
            </button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {legacyPickersEnabled && (
                <button
                  onClick={() => setPracticeButtonPickMode((v) => {
                    const next = !v;
                    if (next) {
                      // Conflict prevention: never allow two global capture listeners at once.
                      stopUniversalPickCaptureImmediate();
                      setUniversalPickMode(false);
                      setPickMode(false);
                      setPeekMode(false);
                    }
                    return next;
                  })}
                  className={`px-3 py-2 rounded-lg text-xs border transition-all ${practiceButtonPickMode ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                >
                  {practiceButtonPickMode ? 'Stop Picking' : 'Pick Button'}
                </button>
              )}
              <button
                onClick={() => setPracticeButtonApplyToAll(v => !v)}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${practiceButtonApplyToAll ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
              >
                {practiceButtonApplyToAll ? 'Apply to all: ON' : 'Apply to all: OFF'}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              Selected: {practiceButtonSelectedKey || 'none'}
            </div>
            <div className="text-[10px] text-white/45 mt-2">
              Targets: <span className="font-mono">data-ui=&quot;practice-button&quot;</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <DevButton onClick={() => saveGlobal(globalDraft)}>Save Global</DevButton>
            <button
              onClick={() => saveSelected(selectedDraft)}
              disabled={!cardState.hasSelected || !cardState.selectedCardId}
              className={`rounded-lg px-3 py-2 text-xs transition-all ${(!cardState.hasSelected || !cardState.selectedCardId) ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
            >
              Save Selected
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <DevButton onClick={resetGlobal}>Reset Global</DevButton>
            <button
              onClick={resetSelected}
              disabled={!cardState.hasSelected}
              className={`rounded-lg px-3 py-2 text-xs transition-all ${!cardState.hasSelected ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
            >
              Reset Selected
            </button>
          </div>
          <button
            onClick={clearAll}
            className="w-full rounded-lg px-3 py-2 text-xs bg-red-500/10 border border-red-500/30 text-red-400/70 hover:bg-red-500/20 transition-all"
          >
            Clear All
          </button>
        </>
      )}
    </Section>
  );
}

export default CardTunerSection;
