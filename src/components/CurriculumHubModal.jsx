import { CurriculumHub } from "./CurriculumHub.jsx";

export function CurriculumHubModal({
  frameRect,
  isLight,
  activeProgram,
  closeCurriculumHub,
  curriculumSetupError,
  setCurriculumSetupError,
  setShowCurriculumHubState,
  setShowCurriculumOnboarding,
}) {
  // Calculate clamped bounds for the host
  const getHostStyle = () => {
    if (!frameRect) return { left: 0, right: 0 };
    const vw = window.innerWidth;
    const rawLeft = frameRect.left;
    const rawRight = frameRect.left + frameRect.width;
    const left = Math.max(0, rawLeft);
    const right = Math.max(0, vw - rawRight);
    return { left, right };
  };

  const hostStyle = getHostStyle();

  return (
    <div className="fixed inset-0 z-[9999] isolate">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xl"
        onClick={() => {
          closeCurriculumHub();
        }}
      />

      {/* frame-aligned modal host - ALWAYS RENDER with fail-safe clamping */}
      <div
        className="absolute top-0 bottom-0 flex justify-center py-6"
        style={hostStyle}
      >
        {/* PANEL - now always mounts to avoid "ghosted app" state */}
        <div
          className="w-full max-w-5xl px-4 overflow-hidden rounded-[28px] flex flex-col shadow-2xl"
          data-card="true"
          data-card-id="modal:curriculumHub"
          style={{
            background: isLight ? '#f6f1e6' : 'rgba(10, 10, 15, 1)',
            maxHeight: 'calc(100vh - 48px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - fixed, non-scrolling */}
          <div className="shrink-0 px-6 pt-6 pb-4 flex items-center justify-between" style={{
            background: isLight ? '#f6f1e6' : 'rgba(10, 10, 15, 1)',
            borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            <div className="min-w-0">
              <h2
                className="type-h2"
                style={{
                  color: 'var(--accent-color)',
                }}
              >
                {activeProgram?.name || 'Curriculum'}
              </h2>
              {activeProgram?.curriculum?.description && (
                <div
                  className="text-sm mt-1"
                  style={{ color: isLight ? 'rgba(60, 50, 40, 0.65)' : 'rgba(253,251,245,0.65)' }}
                >
                  {activeProgram.curriculum.description}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                closeCurriculumHub();
              }}
              className="p-2 rounded-full transition-colors"
              style={{
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body - THE ONLY SCROLL CONTAINER */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            {curriculumSetupError && (
              <div
                className="mx-6 mt-5 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: isLight ? 'rgba(200, 100, 80, 0.1)' : 'rgba(200, 100, 80, 0.12)',
                  border: `1px solid ${isLight ? 'rgba(200, 100, 80, 0.22)' : 'rgba(255, 170, 140, 0.22)'}`,
                  color: isLight ? 'rgba(110, 55, 35, 0.92)' : 'rgba(255, 205, 190, 0.95)',
                }}
              >
                {curriculumSetupError}
              </div>
            )}
            <CurriculumHub
              isInModal
              onBeginSetup={() => {
                setCurriculumSetupError(null);
                setShowCurriculumHubState(false);
                setShowCurriculumOnboarding(true);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
