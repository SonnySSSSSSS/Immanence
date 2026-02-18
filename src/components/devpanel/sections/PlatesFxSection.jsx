import RangeControl from "../ui/RangeControl.jsx";

function PlatesFxSection({
  universalPickerKind,
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
}) {
  if (universalPickerKind !== 'plates') return null;

  return (
    <>
      <div className="space-y-2 mb-3">
        <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
          Selected: {platesSelectedId || 'none'}
        </div>
      </div>

      <div className="border-t border-white/10 pt-3 mt-3 mb-3">
        <div className="text-[11px] text-white/80 font-semibold mb-2">Plates (Caption Tuner)</div>
        <button
          onClick={() => setPlatesFxEnabled(!platesFxEnabled)}
          className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${platesFxEnabled ? 'bg-amber-500/20 text-amber-200 border-amber-400/50' : 'bg-white/5 text-white/70 border-white/15'}`}
        >
          {platesFxEnabled ? 'Global Plate FX: ON' : 'Global Plate FX: OFF'}
        </button>

        <label className="flex items-center gap-2 text-xs text-white/70 mt-3">
          <input
            type="checkbox"
            checked={platesFxDraft.enabled}
            disabled={!platesSelectedId}
            onChange={(e) => patchSelectedPlatePreset({ enabled: e.target.checked })}
            className="rounded border-white/20"
          />
          Enabled for this plate
        </label>

        <div className="mt-3">
          <label className="block text-[10px] text-white/55 mb-1">Profile</label>
          <select
            value={platesFxDraft.profile}
            disabled={!platesSelectedId}
            onChange={(e) => patchSelectedPlatePreset({ profile: e.target.value === 'mythic' ? 'mythic' : 'subtle' })}
            className={`w-full rounded-lg px-3 py-2 text-xs border bg-white/5 border-white/15 text-white/80 ${!platesSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ colorScheme: 'dark' }}
          >
            <option value="subtle">Subtle</option>
            <option value="mythic">Mythic</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <RangeControl
            label="Border Thickness"
            value={platesResolved.effective.borderW}
            min={0.5}
            max={6}
            step={0.05}
            disabled={!platesSelectedId}
            onChange={(v) => patchSelectedPlatePreset({ borderW: v })}
          />
          <RangeControl
            label="Speed"
            value={platesResolved.effective.speed}
            min={4}
            max={24}
            step={0.5}
            disabled={!platesSelectedId}
            onChange={(v) => patchSelectedPlatePreset({ speed: v })}
            suffix="s"
          />
          <RangeControl
            label="Border Opacity"
            value={platesResolved.effective.opacity}
            min={0}
            max={1}
            step={0.05}
            disabled={!platesSelectedId}
            onChange={(v) => patchSelectedPlatePreset({ opacity: v })}
          />
        </div>

        <div className="space-y-2 mt-3">
          <div className="text-[10px] text-white/55">Color Mode</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!platesSelectedId}
              onClick={() => patchSelectedPlatePreset({ colorMode: 'stage' })}
              className={`px-3 py-2 rounded-lg text-xs border transition-all ${platesFxDraft.colorMode === 'stage' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'} ${!platesSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Stage Accent
            </button>
            <button
              disabled={!platesSelectedId}
              onClick={() => patchSelectedPlatePreset({ colorMode: 'custom' })}
              className={`px-3 py-2 rounded-lg text-xs border transition-all ${platesFxDraft.colorMode === 'custom' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'} ${!platesSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Custom
            </button>
          </div>

          {platesFxDraft.colorMode === 'custom' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={platesFxDraft.color || '#FFD278'}
                disabled={!platesSelectedId}
                onChange={(e) => patchSelectedPlatePreset({ color: e?.target?.value || null })}
                className="h-8 w-12 p-0 border border-white/15 rounded"
                style={{ background: 'transparent' }}
              />
              <span className="text-xs text-white/50 font-mono">{platesFxDraft.color || '#FFD278'}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setPlatesAdvancedOpen((v) => !v)}
          disabled={!platesSelectedId}
          className={`w-full mt-3 px-3 py-2 rounded-lg text-xs border transition-all ${platesAdvancedOpen ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50' : 'bg-white/5 text-white/70 border-white/15'} ${!platesSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {platesAdvancedOpen ? `More: ON (${activePlateOverrideCount} override${activePlateOverrideCount === 1 ? '' : 's'})` : 'More...'}
        </button>

        {platesAdvancedOpen && (
          <div className="mt-3 p-3 rounded-lg border border-white/10 bg-white/5 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <RangeControl
                label="Glow"
                value={platesResolved.effective.glow}
                min={0}
                max={24}
                step={0.5}
                disabled={!platesSelectedId}
                onChange={(v) => patchSelectedPlatePreset({ glow: v })}
                suffix="px"
              />
              <RangeControl
                label="Glow Opacity"
                value={platesResolved.effective.glowOpacity}
                min={0}
                max={0.32}
                step={0.01}
                disabled={!platesSelectedId}
                onChange={(v) => patchSelectedPlatePreset({ glowOpacity: v })}
              />
              <RangeControl
                label="BG Opacity"
                value={platesResolved.effective.bgOpacity}
                min={0}
                max={0.45}
                step={0.01}
                disabled={!platesSelectedId}
                onChange={(v) => patchSelectedPlatePreset({ bgOpacity: v })}
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={Boolean(platesResolved.effective.sheen)}
                disabled={!platesSelectedId}
                onChange={(e) => patchSelectedPlatePreset({ sheen: e.target.checked })}
                className="rounded border-white/20"
              />
              Sheen
            </label>

            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={Boolean(platesResolved.effective.animate)}
                disabled={!platesSelectedId}
                onChange={(e) => patchSelectedPlatePreset({ animate: e.target.checked })}
                className="rounded border-white/20"
              />
              Animate
            </label>

            <button
              onClick={resetSelectedPlateOverrides}
              disabled={!platesSelectedId}
              className={`w-full px-3 py-2 rounded-lg text-xs border transition-all bg-white/5 border-white/15 text-white/70 hover:bg-white/10 ${!platesSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Reset Overrides
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default PlatesFxSection;
