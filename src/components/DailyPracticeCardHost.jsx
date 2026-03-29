import { AccessPosturePill } from "./AccessPosturePill.jsx";
import { DailyPracticeCard } from "./DailyPracticeCard.jsx";

export function DailyPracticeCardHost({
  dailyCardAnchor,
  handleStartPractice,
  openCurriculumHub,
  handleSelectSection,
  hasPersistedCurriculumData,
  curriculumOnboardingComplete,
  practiceTimeSlots,
  handleOpenCurriculumSetup,
  isDailyCardTutorialTarget,
  accessPosture,
  setAccessPosture,
  isLight,
  sanctuaryRailStyle,
}) {
  return (
    <div
      className="w-full pt-2"
      style={{
        ...sanctuaryRailStyle,
        borderTop: `1px solid ${isLight ? 'rgba(100, 80, 60, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
      }}
    >
      <div className="w-full" style={{ position: 'relative' }}>
        <div data-tutorial={dailyCardAnchor}>
          <DailyPracticeCard
            onStartPractice={handleStartPractice}
            onViewCurriculum={openCurriculumHub}
            onNavigate={handleSelectSection}
            hasPersistedCurriculumData={hasPersistedCurriculumData}
            onboardingComplete={curriculumOnboardingComplete}
            practiceTimeSlots={practiceTimeSlots}
            onStartSetup={handleOpenCurriculumSetup}
            isTutorialTarget={isDailyCardTutorialTarget}
            showPerLegCompletion={false}
            showDailyCompletionNotice={true}
            showSessionMeter={false}
          />
        </div>
        {/* Guided / Full Access pill toggle — docked to card bottom-right */}
        <AccessPosturePill
          accessPosture={accessPosture}
          setAccessPosture={setAccessPosture}
          isLight={isLight}
        />
      </div>
    </div>
  );
}
