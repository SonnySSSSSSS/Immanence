// src/components/ApplicationSection.jsx
import { useNavigationStore } from '../state/navigationStore.js';
import { SigilSealingArea } from './SigilSealingArea.jsx';
import { ApplicationTrackingCard } from './ApplicationTrackingCard.jsx';

export function ApplicationSection({ onNavigate }) {
  const { activePath } = useNavigationStore();

  const handleOpenArchive = (tab) => {
    const detail = { tab, reportDomain: null };
    try {
      window.__immanence_pending_archive = detail;
    } catch {
      // ignore
    }
    onNavigate?.(null);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('immanence-open-archive', { detail }));
    }, 50);
  };

  // No active path - show empty state
  if (!activePath) {
    return (
      <div data-tutorial="application-root" className="w-full max-w-4xl mx-auto space-y-8 pb-12">
        {/* Empty State */}
        <div
          className="bg-[#0f0f1a] border rounded-3xl p-12 text-center border-[var(--accent-15)]"
          data-card="true"
          data-card-id="applicationEmpty"
        >
          <h2
            className="type-h2 mb-4 text-[var(--accent-color)]"
          >
            Application
          </h2>
          <p
            className="type-body text-[rgba(253,251,245,0.7)] mb-2"
          >
            This is where practice meets life.
          </p>
          <p
            className="type-body text-[rgba(253,251,245,0.6)] mb-6 italic"
          >
            You'll track moments of awareness-when you catch yourself in old patterns.
          </p>
          <button
            onClick={() => {
              console.log('?? Go to Navigation clicked, onNavigate:', typeof onNavigate);
              if (onNavigate) {
                onNavigate('navigation');
              } else {
                console.error('? onNavigate is undefined!');
              }
            }}
            className="type-label px-6 py-3 rounded-full text-[#050508]"
            style={{ background: 'var(--ui-button-gradient)' }}
          >
            GO TO NAVIGATION
          </button>
        </div>
      </div>
    );
  }

  // Active path - show permanent sigil sealing area
  return (
    <div data-tutorial="application-root" className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Permanent Sigil Sealing Area */}
      <SigilSealingArea />

      {/* Awareness Tracking (moved from Home Hub) */}
      <div className="w-full flex justify-center">
        <ApplicationTrackingCard onOpenArchive={handleOpenArchive} />
      </div>
    </div>
  );
}
