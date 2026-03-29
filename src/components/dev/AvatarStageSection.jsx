import React from 'react';
import Section from '../devpanel/ui/Section.jsx';

const STAGE_OPTIONS = ['Seedling', 'Ember', 'Flame', 'Beacon', 'Stellar'];

function AvatarStageSection({
    expanded,
    onToggle,
    isLight,
    avatarStage,
    setAvatarStage,
    normalizedAvatarStageKey,
    avatarDraftStatusLabel,
    visibleAvatarPromoteAck,
    visibleAvatarDefaultStatus,
    handleSaveStageDefault,
    handleResetDraftToDefault,
}) {
    return (
        <>
            <Section
                title="Avatar Stage"
                expanded={expanded}
                onToggle={onToggle}
                isLight={isLight}
            >
                <div className="devpanel-helper-text text-xs text-white/50 mb-3">
                    Stage sets the wallpaper color.
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <label className="devpanel-field-label text-sm font-medium w-16" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'white' }}>Stage</label>
                    <select
                        value={avatarStage}
                        onChange={(e) => {
                            setAvatarStage(e.target.value);
                            window.dispatchEvent(new CustomEvent('dev-avatar-stage', {
                                detail: { stage: e.target.value }
                            }));
                        }}
                        className="devpanel-light-select flex-1 rounded-lg px-3 py-2.5 text-base font-medium"
                        style={{
                            background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                            border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
                            color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                            colorScheme: isLight ? 'light' : 'dark'
                        }}
                    >
                        {STAGE_OPTIONS.map((stageOption) => (
                            <option key={stageOption} value={stageOption}>{stageOption}</option>
                        ))}
                    </select>
                </div>
            </Section>

            <div className="devpanel-avatar-draft-card mb-4 rounded-xl border border-white/15 bg-white/5 p-3">
                <div className="devpanel-avatar-draft-title text-xs font-semibold text-white/85 mb-1">
                    Avatar Draft Preview
                </div>
                <div className="devpanel-helper-text text-[11px] text-white/65 mb-2">
                    Slider edits stay in a temporary working copy. Promote is the explicit save boundary; code defaults remain separate.
                </div>
                <div className="devpanel-avatar-draft-status text-[11px] text-white/75 mb-3">
                    Stage: <span className="devpanel-avatar-draft-stage font-semibold text-white/90">{normalizedAvatarStageKey}</span> | Draft status: {avatarDraftStatusLabel}
                    {visibleAvatarPromoteAck ? ` | ${visibleAvatarPromoteAck}` : ''}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                        onClick={handleSaveStageDefault}
                        className="devpanel-light-primary-action rounded-lg px-3 py-2 text-xs bg-emerald-500/15 border border-emerald-400/35 text-emerald-100 hover:bg-emerald-500/20 transition-all"
                    >
                        Promote in Code
                    </button>
                    <button
                        onClick={handleResetDraftToDefault}
                        className="devpanel-light-secondary-action rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/75 hover:bg-white/10 transition-all"
                    >
                        Restore from Code Default
                    </button>
                </div>
                {!!visibleAvatarDefaultStatus && (
                    <div className="devpanel-helper-text text-[10px] text-white/60">{visibleAvatarDefaultStatus}</div>
                )}
            </div>
        </>
    );
}

export default AvatarStageSection;
