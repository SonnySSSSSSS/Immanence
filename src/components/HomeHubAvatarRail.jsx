import { AvatarV3 } from "./avatarV3/AvatarV3.jsx";

function HomeHubAvatarRail({
  avatarZoneRef,
  onAvatarZoneMouseMove,
  onAvatarZoneMouseLeave,
  railWidth,
  sessionsPanelAnchor,
  avatarRingAnchor,
  stagePanelAnchor,
  leftRolled,
  setLeftRolled,
  rightRolled,
  setRightRolled,
  decayExpanded,
  setDecayExpanded,
  sidePanelFramePrimaryRowStyle,
  sidePanelHousingOuterStyle,
  sidePanelHousingInnerStyle,
  sidePanelHousingLineStyle,
  sidePanelHousingCornerStyle,
  sidePanelTileWrapStyle,
  sidePanelHandleLineStyle,
  sidePanelTileContentBaseStyle,
  sidePanelTileRolledMaxHeight,
  sidePanelTileExpandedMaxHeight,
  sidePanelLeftTileStatsColStyle,
  sidePanelLeftMetricCellStyle,
  sidePanelTileValueStyle,
  sidePanelTileLabelStyle,
  sidePanelTileSubLabelStyle,
  sidePanelTileReportButtonStyle,
  sidePanelTextShadow,
  sidePanelAccentTextShadow,
  panelCollapsedHeight,
  panelExpandedHeight,
  unitScale,
  isLight,
  hubTiles,
  avatarParallax,
  normalizedStage,
  modeWeights,
  isPracticing,
  lastStageChange,
  lastModeChange,
  lastSessionComplete,
  avatarPath,
  nextStageName,
  daysUntilNextEffective,
  stageProgressPct,
  decayInfo,
  onOpenReport,
}) {
  return (
    <div
      className="w-full flex flex-col items-center gap-0 pb-0 transition-colors duration-500 overflow-visible"
      style={{ paddingTop: '12px' }}
    >
      {/* PROBE:flank-housing:START */}
      <div
        ref={avatarZoneRef}
        onMouseMove={onAvatarZoneMouseMove}
        onMouseLeave={onAvatarZoneMouseLeave}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: '18px',
          padding: '0 4px',
          maxWidth: railWidth,
          margin: '0 auto 16px',
          boxSizing: 'border-box',
        }}
      >
        <div
          data-tutorial={sessionsPanelAnchor}
          role="button"
          tabIndex={0}
          aria-expanded={!leftRolled}
          aria-label={leftRolled ? 'Expand practice log panel' : 'Collapse practice log panel'}
          onClick={() => setLeftRolled((rolled) => !rolled)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setLeftRolled((r) => !r); }}
          style={{
            ...sidePanelFramePrimaryRowStyle,
            height: leftRolled ? panelCollapsedHeight : panelExpandedHeight,
            transition: 'height 220ms ease',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <div style={sidePanelHousingOuterStyle} />
          <div style={sidePanelHousingInnerStyle} />
          <div style={{ ...sidePanelHousingLineStyle, bottom: `calc(${unitScale} * 0.82)` }} />
          <div style={{ ...sidePanelHousingCornerStyle, top: `calc(${unitScale} * 0.3)`, left: `calc(${unitScale} * 0.34)`, borderTopWidth: '1px', borderLeftWidth: '1px', borderTopStyle: 'solid', borderLeftStyle: 'solid' }} />
          <div style={{ ...sidePanelHousingCornerStyle, top: `calc(${unitScale} * 0.3)`, right: `calc(${unitScale} * 0.34)`, borderTopWidth: '1px', borderRightWidth: '1px', borderTopStyle: 'solid', borderRightStyle: 'solid' }} />
          <div style={{ ...sidePanelHousingCornerStyle, bottom: `calc(${unitScale} * 0.38)`, left: `calc(${unitScale} * 0.34)`, borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomStyle: 'solid', borderLeftStyle: 'solid' }} />
          <div style={{ ...sidePanelHousingCornerStyle, bottom: `calc(${unitScale} * 0.38)`, right: `calc(${unitScale} * 0.34)`, borderBottomWidth: '1px', borderRightWidth: '1px', borderBottomStyle: 'solid', borderRightStyle: 'solid' }} />
          <div style={{ ...sidePanelTileWrapStyle, position: 'relative', zIndex: 1, height: '100%' }}>
            <span
              aria-hidden="true"
              style={{
                ...sidePanelHandleLineStyle,
                position: 'absolute',
                top: `calc(${unitScale} * 0.45)`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `clamp(24px, calc(${unitScale} * 1.7), 36px)`,
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
            <div
              style={{
                ...sidePanelTileContentBaseStyle,
                maxHeight: leftRolled ? sidePanelTileRolledMaxHeight : sidePanelTileExpandedMaxHeight,
                opacity: leftRolled ? 0.86 : 1,
              }}
            >
              <div style={sidePanelLeftTileStatsColStyle}>
                <div style={sidePanelLeftMetricCellStyle}>
                  <div className="type-metric" style={{ ...sidePanelTileValueStyle, color: isLight ? 'rgba(18, 68, 78, 0.96)' : 'rgba(233, 252, 255, 0.96)', textShadow: sidePanelAccentTextShadow }}>
                    {Math.round(hubTiles?.sessions_total ?? 0)}
                  </div>
                  <div className="type-label" style={{ ...sidePanelTileLabelStyle, color: isLight ? 'rgba(31, 97, 108, 0.82)' : 'rgba(170, 230, 236, 0.82)', textShadow: sidePanelTextShadow }}>
                    Sessions
                  </div>
                  <div className="type-label" style={{ ...sidePanelTileSubLabelStyle, color: isLight ? 'rgba(31, 97, 108, 0.56)' : 'rgba(170, 230, 236, 0.54)', textShadow: sidePanelTextShadow }}>
                    14D
                  </div>
                </div>
                <div style={sidePanelLeftMetricCellStyle}>
                  <div className="type-metric" style={{ ...sidePanelTileValueStyle, color: isLight ? 'rgba(18, 68, 78, 0.96)' : 'rgba(233, 252, 255, 0.96)', textShadow: sidePanelAccentTextShadow }}>
                    {Math.round(hubTiles?.days_active ?? 0)}
                  </div>
                  <div className="type-label" style={{ ...sidePanelTileLabelStyle, color: isLight ? 'rgba(31, 97, 108, 0.82)' : 'rgba(170, 230, 236, 0.82)', textShadow: sidePanelTextShadow }}>
                    Active
                  </div>
                  <div className="type-label" style={{ ...sidePanelTileSubLabelStyle, color: isLight ? 'rgba(31, 97, 108, 0.56)' : 'rgba(170, 230, 236, 0.54)', textShadow: sidePanelTextShadow }}>
                    Days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          data-tutorial={avatarRingAnchor}
          className="relative flex items-center justify-center overflow-visible"
          style={{ flex: '1 1 auto', minWidth: 0 }}
        >
          <div
            className="absolute transition-opacity duration-500"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(90%, 525px)',
              height: 'min(90%, 525px)',
              background: 'radial-gradient(circle, ' +
                'var(--accent-glow) 0%, ' +
                'var(--accent-glow)40 12%, ' +
                'var(--accent-glow)18 35%, ' +
                'var(--accent-glow)05 55%, ' +
                'transparent 75%)',
              filter: 'blur(75px)',
              opacity: isLight ? 0.06 : 0.20,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div
            className="relative z-10 flex items-center justify-center"
            style={{ transform: `translate(${avatarParallax.x}px, ${avatarParallax.y}px)`, transition: 'transform 400ms cubic-bezier(0.2, 0.9, 0.2, 1)' }}
          >
            <AvatarV3
              stage={normalizedStage}
              modeWeights={modeWeights}
              isPracticing={isPracticing}
              lastStageChange={lastStageChange}
              lastModeChange={lastModeChange}
              lastSessionComplete={lastSessionComplete}
              path={avatarPath}
              size="hearth"
            />
          </div>
        </div>

        <div
          data-tutorial={stagePanelAnchor}
          role="button"
          tabIndex={0}
          aria-expanded={!rightRolled}
          aria-label={rightRolled ? 'Expand rhythm report panel' : 'Collapse rhythm report panel'}
          onClick={() => setRightRolled((rolled) => !rolled)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRightRolled((r) => !r); }}
          style={{
            ...sidePanelFramePrimaryRowStyle,
            height: rightRolled ? panelCollapsedHeight : panelExpandedHeight,
            transition: 'height 220ms ease',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <div style={sidePanelHousingOuterStyle} />
          <div style={sidePanelHousingInnerStyle} />
          <div style={{ ...sidePanelHousingLineStyle, bottom: `calc(${unitScale} * 0.82)` }} />
          <div style={{ ...sidePanelHousingCornerStyle, top: `calc(${unitScale} * 0.3)`, left: `calc(${unitScale} * 0.34)`, borderTopWidth: '1px', borderLeftWidth: '1px', borderTopStyle: 'solid', borderLeftStyle: 'solid' }} />
          <div style={{ ...sidePanelHousingCornerStyle, top: `calc(${unitScale} * 0.3)`, right: `calc(${unitScale} * 0.34)`, borderTopWidth: '1px', borderRightWidth: '1px', borderTopStyle: 'solid', borderRightStyle: 'solid' }} />
          <div style={{ ...sidePanelHousingCornerStyle, bottom: `calc(${unitScale} * 0.38)`, left: `calc(${unitScale} * 0.34)`, borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomStyle: 'solid', borderLeftStyle: 'solid' }} />
          <div style={{ ...sidePanelHousingCornerStyle, bottom: `calc(${unitScale} * 0.38)`, right: `calc(${unitScale} * 0.34)`, borderBottomWidth: '1px', borderRightWidth: '1px', borderBottomStyle: 'solid', borderRightStyle: 'solid' }} />
          <div style={{ ...sidePanelTileWrapStyle, position: 'relative', zIndex: 1, height: '100%' }}>
            <span
              aria-hidden="true"
              style={{
                ...sidePanelHandleLineStyle,
                position: 'absolute',
                top: `calc(${unitScale} * 0.45)`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `clamp(24px, calc(${unitScale} * 1.7), 36px)`,
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
            <div
              style={{
                ...sidePanelTileContentBaseStyle,
                maxHeight: rightRolled ? sidePanelTileRolledMaxHeight : sidePanelTileExpandedMaxHeight,
                opacity: rightRolled ? 0.86 : 1,
                gap: `calc(${unitScale} * 0.18)`,
              }}
            >
              <div className="type-label" style={{ ...sidePanelTileLabelStyle, fontSize: '9px', whiteSpace: 'nowrap', color: isLight ? 'rgba(31, 97, 108, 0.82)' : 'rgba(170, 230, 236, 0.84)', textShadow: sidePanelTextShadow, textAlign: 'center', letterSpacing: '0.10em' }}>
                {nextStageName}
              </div>
              <div style={{ textAlign: 'center', lineHeight: 1 }}>
                <span className="type-metric" style={{ ...sidePanelTileValueStyle, fontSize: '26px', fontWeight: 700, color: isLight ? 'rgba(18, 68, 78, 0.96)' : 'rgba(233, 252, 255, 0.96)', textShadow: sidePanelAccentTextShadow }}>
                  {daysUntilNextEffective}
                </span>
              </div>
              <div className="type-label" style={{ ...sidePanelTileLabelStyle, fontSize: '9px', textAlign: 'center', color: isLight ? 'rgba(31, 97, 108, 0.82)' : 'rgba(170, 230, 236, 0.84)', textShadow: sidePanelTextShadow }}>
                days remaining
              </div>
              <div style={{ width: '100%', padding: '0 2px', boxSizing: 'border-box' }}>
                <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: isLight ? 'var(--accent-15)' : 'var(--accent-10)' }}>
                  <div style={{ height: '100%', width: `${stageProgressPct}%`, borderRadius: '2px', background: isLight ? `linear-gradient(90deg, var(--accent-70), var(--accent-40))` : `linear-gradient(90deg, var(--accent-80), var(--accent-50))`, boxShadow: isLight ? '0 0 4px var(--accent-20)' : '0 0 6px var(--accent-30)', transition: 'width 600ms ease' }} />
                </div>
              </div>
              <div
                className="hub-penalty-label type-label"
                onClick={() => setDecayExpanded((v) => !v)}
                style={{
                  textAlign: 'center',
                  fontSize: '9px',
                  lineHeight: 1,
                  letterSpacing: '0.06em',
                  color: decayInfo.isRecovering ? 'rgba(76,175,80,0.85)' : (isLight ? 'rgba(31, 97, 108, 0.65)' : 'rgba(170, 230, 236, 0.58)'),
                  cursor: 'pointer',
                  textShadow: sidePanelTextShadow,
                }}
              >
                {decayInfo.isRecovering ? `+${decayInfo.recoveryRate}/day recovery` : `−${decayInfo.decayPerMissedDay.toFixed(2)}/miss`}
              </div>
              {decayExpanded && (
                <div style={{ fontSize: '9px', color: isLight ? 'rgba(31,97,108,0.7)' : 'rgba(170,230,236,0.65)', lineHeight: 1.45, textAlign: 'center', paddingTop: '4px' }}>
                  <div>−{decayInfo.decayPerMissedDay.toFixed(2)} per missed day</div>
                  <div>Accumulated: {decayInfo.decayAccumulated}d</div>
                  <div>
                    {decayInfo.isRecovering ? `Recovering −${decayInfo.recoveryRate}/day · ${decayInfo.consecutiveDays}d streak` : `${decayInfo.consecutiveDays}/7 days to recovery bonus`}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpenReport(); }}
                className="hub-report-btn type-label rounded-full font-bold transition-all hover:scale-105"
                style={{
                  ...sidePanelTileReportButtonStyle,
                  background: isLight ? 'linear-gradient(135deg, rgba(54, 175, 190, 0.72), rgba(124, 227, 235, 0.52))' : 'linear-gradient(135deg, rgba(41, 182, 198, 0.62), rgba(96, 238, 247, 0.34))',
                  boxShadow: isLight ? '0 3px 10px rgba(44, 172, 189, 0.14)' : '0 0 10px rgba(72, 208, 220, 0.2)',
                }}
              >
                REPORT
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* PROBE:flank-housing:END */}
    </div>
  );
}

export { HomeHubAvatarRail };
