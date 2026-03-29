import { createPortal } from 'react-dom';
import { CurriculumCompletionReport } from "./CurriculumCompletionReport.jsx";
import { CurriculumHubModal } from "./CurriculumHubModal.jsx";

export function CurriculumHubPortal({
  showCurriculumHub,
  isCurriculumComplete,
  frameRect,
  isLight,
  activeProgram,
  closeCurriculumHub,
  curriculumSetupError,
  setCurriculumSetupError,
  setShowCurriculumHubState,
  setShowCurriculumOnboarding,
  portalTarget,
}) {
  if (!showCurriculumHub) {
    return null;
  }

  return createPortal(
    (() => {
      const isComplete = isCurriculumComplete();

      return isComplete ? (
        // Show completion report if curriculum is done
        <CurriculumCompletionReport
          onDismiss={closeCurriculumHub}
        />
      ) : (
        <CurriculumHubModal
          frameRect={frameRect}
          isLight={isLight}
          activeProgram={activeProgram}
          closeCurriculumHub={closeCurriculumHub}
          curriculumSetupError={curriculumSetupError}
          setCurriculumSetupError={setCurriculumSetupError}
          setShowCurriculumHubState={setShowCurriculumHubState}
          setShowCurriculumOnboarding={setShowCurriculumOnboarding}
        />
      );
    })(),
    portalTarget
  );
}
