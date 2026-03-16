// src/components/ApplicationSection.jsx
import { useNavigationStore } from '../state/navigationStore.js';
import { SigilSealingArea } from './SigilSealingArea.jsx';
import { ApplicationTrackingCard } from './ApplicationTrackingCard.jsx';

const APPLICATION_CHAMFER = '20px';
const APPLICATION_CLIP_PATH = `polygon(${APPLICATION_CHAMFER} 0, calc(100% - ${APPLICATION_CHAMFER}) 0, 100% ${APPLICATION_CHAMFER}, 100% calc(100% - ${APPLICATION_CHAMFER}), calc(100% - ${APPLICATION_CHAMFER}) 100%, ${APPLICATION_CHAMFER} 100%, 0 calc(100% - ${APPLICATION_CHAMFER}), 0 ${APPLICATION_CHAMFER})`;

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
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          data-card="true"
          data-card-id="applicationEmpty"
          style={{
            clipPath: APPLICATION_CLIP_PATH,
            background: 'linear-gradient(180deg, rgba(7, 16, 24, 0.95) 0%, rgba(4, 10, 18, 0.92) 100%)',
            border: '1px solid rgba(112, 233, 242, 0.18)',
            boxShadow: '0 18px 34px rgba(0, 0, 0, 0.34), 0 0 12px rgba(78, 214, 226, 0.08), inset 0 1px 0 rgba(168, 241, 248, 0.08), inset 0 -10px 18px rgba(0,0,0,0.34)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-[8px] pointer-events-none"
            style={{
              clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
              background: 'linear-gradient(180deg, rgba(8, 16, 24, 0.42) 0%, rgba(9, 18, 27, 0.3) 44%, rgba(4, 10, 17, 0.46) 100%)',
              border: '1px solid rgba(101, 211, 224, 0.10)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 h-px pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(117, 231, 240, 0.64) 0%, rgba(117, 231, 240, 0.22) 18%, rgba(117, 231, 240, 0.1) 82%, rgba(117, 231, 240, 0.44) 100%)',
              boxShadow: '0 0 10px rgba(87, 222, 236, 0.2)',
            }}
          />
          <div aria-hidden="true" className="absolute top-[10px] left-[10px] h-[14px] w-[14px] pointer-events-none" style={{ borderTop: '1px solid rgba(117, 231, 240, 0.48)', borderLeft: '1px solid rgba(117, 231, 240, 0.48)' }} />
          <div aria-hidden="true" className="absolute top-[10px] right-[10px] h-[14px] w-[14px] pointer-events-none" style={{ borderTop: '1px solid rgba(117, 231, 240, 0.48)', borderRight: '1px solid rgba(117, 231, 240, 0.48)' }} />
          <div aria-hidden="true" className="absolute bottom-[10px] left-[10px] h-[14px] w-[14px] pointer-events-none" style={{ borderBottom: '1px solid rgba(117, 231, 240, 0.48)', borderLeft: '1px solid rgba(117, 231, 240, 0.48)' }} />
          <div aria-hidden="true" className="absolute bottom-[10px] right-[10px] h-[14px] w-[14px] pointer-events-none" style={{ borderBottom: '1px solid rgba(117, 231, 240, 0.48)', borderRight: '1px solid rgba(117, 231, 240, 0.48)' }} />
          <div className="relative z-10">
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
            style={{
              background: 'linear-gradient(135deg, rgba(72, 196, 208, 0.92), rgba(52, 186, 120, 0.92))',
              boxShadow: '0 6px 18px rgba(72, 196, 208, 0.22)',
            }}
          >
            GO TO NAVIGATION
          </button>
          </div>
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
