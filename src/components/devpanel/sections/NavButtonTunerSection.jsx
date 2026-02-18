import Section from "../ui/Section.jsx";
import TextControl from "../ui/TextControl.jsx";
import RangeControl from "../ui/RangeControl.jsx";

function NavButtonTunerSection({
  expanded,
  onToggle,
  isLight,
  devtoolsEnabled,
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
      title="Navigation Button FX Tuner"
      expanded={expanded}
      onToggle={onToggle}
      isLight={isLight}
    >
      {!devtoolsEnabled ? (
        <div className="text-xs text-white/50">Locked</div>
      ) : (
        <>
          <div className="text-[10px] text-white/50 mb-2">
            Targets <span className="font-mono">.im-nav-btn</span> only. Uses <span className="font-mono">--nav-btn-*</span> tokens.
          </div>
          <button
            onClick={() => setNavBtnProbeEnabled(v => !v)}
            className={`w-full mb-2 px-3 py-2 rounded-lg text-xs border transition-all ${navBtnProbeEnabled ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
          >
            {navBtnProbeEnabled ? 'Nav Button Probe: ON' : 'Nav Button Probe: OFF'}
          </button>
          <button
            onClick={() => setNavButtonTunerEnabled(!navBtnState.enabled)}
            className={`w-full mb-3 px-3 py-2 rounded-lg text-xs border transition-all ${navBtnState.enabled ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
          >
            {navBtnState.enabled ? 'Nav Button Tuner: ON' : 'Nav Button Tuner: OFF'}
          </button>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <TextControl
                label="Border color"
                value={navBtnDraft.navBtnBorder}
                onChange={(v) => onChangeNavBtnSetting('navBtnBorder', v)}
                disabled={!navBtnState.enabled}
                placeholder="e.g. var(--accent-30) or rgba(255,255,255,0.2)"
              />
              <TextControl
                label="Text color"
                value={navBtnDraft.navBtnTextColor}
                onChange={(v) => onChangeNavBtnSetting('navBtnTextColor', v)}
                disabled={!navBtnState.enabled}
                placeholder="e.g. var(--accent-color)"
              />
              <TextControl
                label="Background RGB"
                value={navBtnDraft.navBtnBg}
                onChange={(v) => onChangeNavBtnSetting('navBtnBg', v)}
                disabled={!navBtnState.enabled}
                placeholder="e.g. 255, 255, 255"
              />
            </div>
            <RangeControl
              label="Transparency"
              value={navBtnDraft.navBtnOpacity}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) => onChangeNavBtnSetting('navBtnOpacity', v)}
              disabled={!navBtnState.enabled}
            />
            <RangeControl
              label="Background alpha"
              value={navBtnDraft.navBtnBgAlpha}
              min={0}
              max={0.3}
              step={0.01}
              onChange={(v) => onChangeNavBtnSetting('navBtnBgAlpha', v)}
              disabled={!navBtnState.enabled}
            />
            <RangeControl
              label="Stroke thickness"
              value={navBtnDraft.navBtnBorderWidth}
              min={0}
              max={4}
              step={0.25}
              onChange={(v) => onChangeNavBtnSetting('navBtnBorderWidth', v)}
              disabled={!navBtnState.enabled}
              suffix="px"
            />
            <RangeControl
              label="Stroke glow"
              value={navBtnDraft.navBtnGlow}
              min={0}
              max={60}
              step={1}
              onChange={(v) => onChangeNavBtnSetting('navBtnGlow', v)}
              disabled={!navBtnState.enabled}
              suffix="px"
            />
            <RangeControl
              label="Blur"
              value={navBtnDraft.navBtnBackdropBlur}
              min={0}
              max={20}
              step={1}
              onChange={(v) => onChangeNavBtnSetting('navBtnBackdropBlur', v)}
              disabled={!navBtnState.enabled}
              suffix="px"
            />
            <RangeControl
              label="Text glow"
              value={navBtnDraft.navBtnTextGlow}
              min={0}
              max={60}
              step={1}
              onChange={(v) => onChangeNavBtnSetting('navBtnTextGlow', v)}
              disabled={!navBtnState.enabled}
              suffix="px"
            />
            <RangeControl
              label="Hover intensity"
              value={navBtnDraft.navBtnHoverIntensity}
              min={0}
              max={1.5}
              step={0.05}
              onChange={(v) => onChangeNavBtnSetting('navBtnHoverIntensity', v)}
              disabled={!navBtnState.enabled}
            />
          </div>

          <button
            onClick={() => {
              resetNavButtonSettings();
            }}
            disabled={!navBtnState.enabled}
            className={`w-full mt-3 rounded-lg px-3 py-2 text-xs transition-all ${!navBtnState.enabled ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
          >
            Reset Nav Button FX
          </button>
        </>
      )}
    </Section>
  );
}

export default NavButtonTunerSection;
