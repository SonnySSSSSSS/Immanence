import { SimpleModeButton } from "./SimpleModeButton.jsx";

function HomeHubModeRail({
  userMode,
  activeSection,
  lockToHub,
  handleSelectSection,
  modeTileBackgroundImage,
  sanctuaryRailStyle,
}) {
  return (
    <>
      {/* EXPLORE MODES - Navigation Buttons */}
      <style>{`
        .im-nav-pill {
          background-image: ${modeTileBackgroundImage} !important;
        }
      `}</style>
      {userMode !== 'student' ? (
        <div
          className="w-full transition-all duration-700"
          style={{
            ...sanctuaryRailStyle,
            maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
            margin: '0 auto',
          }}
        >
          <div
            className="flex flex-row items-center w-full"
            style={{ justifyContent: 'space-between', gap: '0' }}
          >
            <div className="relative flex flex-col items-center justify-start">
              <SimpleModeButton
                title="Practice"
                onClick={() => handleSelectSection("practice")}
                disabled={lockToHub}
                icon="practice"
                isActive={activeSection === 'practice'}
                className="im-nav-pill"
                data-nav-pill-id="home:practice"
                data-ui-target="true"
                data-ui-scope="role"
                data-ui-role-group="homeHub"
                data-ui-id="homeHub:mode:practice"
              />
            </div>
            <SimpleModeButton
              title="Wisdom"
              onClick={() => handleSelectSection("wisdom")}
              disabled={lockToHub}
              icon="wisdom"
              isActive={activeSection === 'wisdom'}
              className="im-nav-pill"
              data-nav-pill-id="home:wisdom"
              data-ui-target="true"
              data-ui-scope="role"
              data-ui-role-group="homeHub"
              data-ui-id="homeHub:mode:wisdom"
            />
            <SimpleModeButton
              title="Application"
              onClick={() => handleSelectSection("application")}
              disabled={lockToHub}
              icon="application"
              isActive={activeSection === 'application'}
              className="im-nav-pill"
              data-nav-pill-id="home:application"
              data-ui-target="true"
              data-ui-scope="role"
              data-ui-role-group="homeHub"
              data-ui-id="homeHub:mode:application"
            />
            <SimpleModeButton
              title="Navigation"
              onClick={() => handleSelectSection("navigation")}
              disabled={lockToHub}
              icon="navigation"
              isActive={activeSection === 'navigation'}
              className="im-nav-pill"
              data-tutorial="home-curriculum-card"
              data-nav-pill-id="home:navigation"
              data-ui-target="true"
              data-ui-scope="role"
              data-ui-role-group="homeHub"
              data-ui-id="homeHub:mode:navigation"
            />
          </div>
        </div>
      ) : (
        <div
          className="w-full transition-all duration-700"
          style={{
            ...sanctuaryRailStyle,
            maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
            margin: '0 auto',
          }}
        >
          <div
            className="flex flex-row items-center w-full"
            style={{ justifyContent: 'center', gap: '48px' }}
          >
            <SimpleModeButton
              title="Practice"
              onClick={() => handleSelectSection("practice", { forceStudentNavigation: true })}
              disabled={lockToHub}
              icon="practice"
              isActive={activeSection === 'practice'}
              className="im-nav-pill"
              data-nav-pill-id="home:practice"
            />
            <SimpleModeButton
              title="Navigation"
              onClick={() => handleSelectSection("navigation", { forceStudentNavigation: true })}
              disabled={lockToHub}
              icon="navigation"
              isActive={activeSection === 'navigation'}
              className="im-nav-pill"
              data-tutorial="home-curriculum-card"
              data-nav-pill-id="home:navigation"
            />
          </div>
        </div>
      )}
    </>
  );
}

export { HomeHubModeRail };
