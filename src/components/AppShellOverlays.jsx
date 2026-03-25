import { lazy, Suspense } from "react";
import { CurriculumCompletionReport } from "./CurriculumCompletionReport.jsx";
import { InstallPrompt } from "./InstallPrompt.jsx";
import { HardwareGuide } from "./HardwareGuide.jsx";
import { PhoticCirclesOverlay } from "./PhoticCirclesOverlay.jsx";
import { SettingsPanel } from "./SettingsPanel.jsx";
import { TutorialOverlay } from "./tutorial/TutorialOverlay.jsx";
import { ShadowScanOverlay } from "./debug/ShadowScanOverlay.jsx";

const DevPanel = lazy(() =>
  import("./DevPanel.jsx").then((m) => ({ default: m.DevPanel }))
);
const PracticeButtonElectricBorderOverlay = lazy(() =>
  import("./dev/PracticeButtonElectricBorderOverlay.jsx").then((m) => ({
    default: m.PracticeButtonElectricBorderOverlay,
  }))
);
const SelectedCardElectricBorderOverlay = lazy(() =>
  import("./dev/SelectedCardElectricBorderOverlay.jsx").then((m) => ({
    default: m.SelectedCardElectricBorderOverlay,
  }))
);
const SelectedControlElectricBorderOverlay = lazy(() =>
  import("./dev/SelectedControlElectricBorderOverlay.jsx").then((m) => ({
    default: m.SelectedControlElectricBorderOverlay,
  }))
);
const SelectedPlateOverlay = lazy(() =>
  import("./dev/SelectedPlateOverlay.jsx").then((m) => ({
    default: m.SelectedPlateOverlay,
  }))
);

export function AppShellOverlays({
  children,
  showCurriculumReport,
  onDismissCurriculumReport,
  showSettings,
  onCloseSettings,
  onSettingsSignedOut,
  devPanelGateEnabled,
  showDevPanel,
  onCloseDevPanel,
  effectivePreviewStage,
  handlePreviewStageChange,
  effectivePreviewPath,
  handlePreviewPathChange,
  previewShowCore,
  setPreviewShowCore,
  previewAttention,
  setPreviewAttention,
  selectionEnabled,
  isDev,
  isPhoticOpen,
  handleClosePhotic,
  isHardwareGuideOpen,
  onCloseHardwareGuide,
  debugShadowScan,
}) {
  return (
    <>
      {showCurriculumReport && (
        <CurriculumCompletionReport onDismiss={onDismissCurriculumReport} />
      )}

      <SettingsPanel
        isOpen={showSettings}
        onClose={onCloseSettings}
        onSignedOut={onSettingsSignedOut}
      />

      {devPanelGateEnabled && (
        <Suspense fallback={null}>
          <DevPanel
            isOpen={showDevPanel}
            onClose={onCloseDevPanel}
            avatarStage={effectivePreviewStage}
            setAvatarStage={handlePreviewStageChange}
            avatarPath={effectivePreviewPath}
            setAvatarPath={handlePreviewPathChange}
            showCore={previewShowCore}
            setShowCore={setPreviewShowCore}
            avatarAttention={previewAttention}
            setAvatarAttention={setPreviewAttention}
          />
        </Suspense>
      )}

      {selectionEnabled && (
        <Suspense fallback={null}>
          <PracticeButtonElectricBorderOverlay />
          <SelectedControlElectricBorderOverlay />
          <SelectedPlateOverlay />
          {isDev && <SelectedCardElectricBorderOverlay />}
        </Suspense>
      )}

      {children}

      <PhoticCirclesOverlay
        isOpen={isPhoticOpen}
        onClose={handleClosePhotic}
        autoStart={true}
      />

      <HardwareGuide
        isOpen={isHardwareGuideOpen}
        onClose={onCloseHardwareGuide}
      />

      <InstallPrompt />

      <TutorialOverlay />

      <ShadowScanOverlay enabled={isDev && debugShadowScan} />
    </>
  );
}

export default AppShellOverlays;
