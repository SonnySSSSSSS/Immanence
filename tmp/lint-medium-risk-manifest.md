# Medium-Risk Lint Manifest
Generated: 2026-03-05

## Summary
- Total problems: 78 (61 errors, 17 warnings)
- Files scanned: 11

## Manifest Table

| File | Rule | Line | Message |
|------|------|------|---------|
| `Sparkline.jsx` | `no-unused-vars` | 27 | `moveTooltip` is defined but never used |
| `Sparkline.jsx` | `no-unused-vars` | 31 | `minValue` is assigned a value but never used |
| `Sparkline.jsx` | `no-unused-vars` | 31 | `maxValue` is assigned a value but never used |
| `Sparkline.jsx` | `react-hooks/purity` | 73 | Cannot call impure function `Math.random` during render |
| `AreaLineChart.jsx` | `no-unused-vars` | 25 | `moveTooltip` is assigned a value but never used |
| `AreaLineChart.jsx` | `no-unused-vars` | 29 | `maxValue` is assigned a value but never used |
| `AreaLineChart.jsx` | `no-unused-vars` | 29 | `minValue` is assigned a value but never used |
| `AreaLineChart.jsx` | `no-unused-vars` | 69 | `seriesIdx` is defined but never used |
| `AreaLineChart.jsx` | `react-hooks/rules-of-hooks` | 154 | React Hook `useMemo` is called conditionally |
| `AreaLineChart.jsx` | `no-unused-vars` | 155 | `_` is defined but never used |
| `AreaLineChart.jsx` | `no-unused-vars` | 155 | `i` is defined but never used |
| `AreaLineChart.jsx` | `react-hooks/purity` | 155 | Cannot call impure function `Math.random` during render |
| `AreaLineChart.jsx` | `react-hooks/exhaustive-deps` | 156 | `useMemo` missing dependency `series` |
| `DonutChart.jsx` | `no-unused-vars` | 36 | `i` is defined but never used |
| `DonutChart.jsx` | `react-hooks/immutability` | 66 | Cannot reassign `currentAngle` after render completes |
| `avatar/index.jsx` | `no-unused-vars` | 9 | `useCallback` is defined but never used |
| `avatar/index.jsx` | `no-unused-vars` | 26 | `label` is assigned a value but never used |
| `avatar/index.jsx` | `react-hooks/set-state-in-effect` | 42 | Calling `setMaxVariations` synchronously within an effect |
| `avatar/index.jsx` | `no-unused-vars` | 102 | `avgAccuracy` is assigned a value but never used |
| `PracticeOptionsCard.jsx` | `no-unused-vars` | 4 | `useDisplayModeStore` is defined but never used |
| `PracticeOptionsCard.jsx` | `no-unused-vars` | 43 | `tempoSyncEnabled` is defined but never used |
| `PracticeOptionsCard.jsx` | `no-unused-vars` | 44 | `tempoPhaseDuration` is defined but never used |
| `PracticeOptionsCard.jsx` | `no-unused-vars` | 45 | `tempoBeatsPerPhase` is defined but never used |
| `PracticeOptionsCard.jsx` | `no-unused-vars` | 54 | `practice` is assigned a value but never used |
| `PracticeOptionsCard.jsx` | `react-hooks/set-state-in-effect` | 84 | Calling `setShowTrajectory` synchronously within an effect |
| `PracticeOptionsCard.jsx` | `react-hooks/set-state-in-effect` | 95 | Calling `setShowTempoSync` synchronously within an effect |
| `BodyScanVisual.jsx` | `no-unused-vars` | 2 | `motion` is defined but never used |
| `BodyScanVisual.jsx` | `react-hooks/set-state-in-effect` | 15 | Calling `setActivePoint` synchronously within an effect |
| `BodyScanVisual.jsx` | `react-hooks/set-state-in-effect` | 91 | Calling `setSushumnaPos(null)` synchronously within an effect |
| `DailyPracticeCard.jsx` | `no-unused-vars` | 53 | `getAdherenceColor` is defined but never used |
| `DailyPracticeCard.jsx` | `react-hooks/exhaustive-deps` | 529 | `useMemo` has unnecessary dependencies |
| `DailyPracticeCard.jsx` | `react-hooks/exhaustive-deps` | 534 | `useMemo` has unnecessary dependencies |
| `DailyPracticeCard.jsx` | `no-unused-vars` | 629 | `stageLower` is assigned a value but never used |
| `DailyPracticeCard.jsx` | `no-unused-vars` | 677 | `displayName` is assigned a value but never used |
| `DailyPracticeCard.jsx` | `react-hooks/exhaustive-deps` | 746 | `useEffect` missing dependency `launchPathPractice` |
| `DailyPracticeCard.jsx` | `no-unused-vars` | 1168 | `practiceParamsPatch` is assigned a value but never used |
| `DailyPracticeCard.jsx` | `no-unused-vars` | 1169 | `practiceConfig` is assigned a value but never used |
| `DailyPracticeCard.jsx` | `no-unused-vars` | 1252 | `progress` is assigned a value but never used |
| `DailyPracticeCard.jsx` | `react-hooks/rules-of-hooks` | 1640 | `useEffect` is called conditionally |
| `DailyPracticeCard.jsx` | `react-hooks/exhaustive-deps` | 1673 | `useEffect` missing deps `isLegExpired`, `isLegTooEarly` |
| `DailyPracticeCard.jsx` | `no-irregular-whitespace` | 1931 | Irregular whitespace not allowed |
| `PracticeSection.jsx` | `react-hooks/set-state-in-effect` | 316 | Calling `setScrollOffset` synchronously within an effect |
| `PracticeSection.jsx` | `no-unused-vars` | 444 | `benchmarksByRunId` is assigned a value but never used |
| `PracticeSection.jsx` | `no-unused-vars` | 453 | `saveRunBenchmark` is assigned a value but never used |
| `PracticeSection.jsx` | `no-unused-vars` | 514 | `lastPracticeLaunchContext` is assigned a value but never used |
| `PracticeSection.jsx` | `no-unused-vars` | 515 | `lastPracticeStartProbe` is assigned a value but never used |
| `PracticeSection.jsx` | `react-hooks/immutability` | 890 | `setCircuitConfig` accessed before it is declared |
| `PracticeSection.jsx` | `react-hooks/immutability` | 894 | `setActiveCircuitId` accessed before it is declared |
| `PracticeSection.jsx` | `no-unused-vars` | 1023 | `lastErrorMs` is assigned a value but never used |
| `PracticeSection.jsx` | `no-unused-vars` | 1032 | `currentStepIndex` is assigned a value but never used |
| `PracticeSection.jsx` | `react-hooks/exhaustive-deps` | 906 | `useEffect` missing deps `setActiveCircuitId`, `setCircuitConfig` |
| `ShadowScanOverlay.jsx` | `no-unused-vars` | 8 | `setDebugFlag` is defined but never used |
| `ShadowScanOverlay.jsx` | `react-hooks/set-state-in-effect` | 167 | Calling `setFrameRect(null)` synchronously within an effect |
| `ShadowScanOverlay.jsx` | `react-hooks/set-state-in-effect` | 195 | Calling `setLocked(null)` synchronously within an effect |
| `ShadowScanOverlay.jsx` | `react-hooks/set-state-in-effect` | 242 | Calling `setSelectedKey(null)` synchronously within an effect |
| `ShadowScanOverlay.jsx` | `react-hooks/exhaustive-deps` | 238 | `candidates` logical expression may change deps every render |
| `ThoughtObservation.jsx` | `no-unused-vars` | 2 | `motion` is defined but never used |
| `ThoughtObservation.jsx` | `react-hooks/purity` | 34 | Cannot call impure function `Date.now` during render |
| `PolygonBreathScene.jsx` | `no-unused-vars` | 146 | `w` is assigned a value but never used |
| `PolygonBreathScene.jsx` | `no-unused-vars` | 147 | `h` is assigned a value but never used |
| `PolygonBreathScene.jsx` | `no-unused-vars` | 185 | `reducedEffects` is assigned a value but never used |
| `PolygonBreathScene.jsx` | `no-unused-vars` | 186 | `scene` is assigned a value but never used |
| `PolygonBreathScene.jsx` | `react-hooks/immutability` | 235 | `gl.shadowMap.enabled = false` - cannot modify hook value |
| `PolygonBreathScene.jsx` | `no-unused-vars` | 253 | `texSubImageCallCount` is assigned a value but never used |
| `PolygonBreathScene.jsx` | `no-unused-vars` | 254 | `pixelStoreiCallCount` is assigned a value but never used |
| `PolygonBreathScene.jsx` | `no-constant-binary-expression` | 588 | Unexpected constant truthiness on left-hand side of `&&` |
