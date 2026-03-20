// src/components/ApplicationSection.jsx
import { SigilSealingArea } from './SigilSealingArea.jsx';
import { ApplicationTrackingCard } from './ApplicationTrackingCard.jsx';

export function ApplicationSection({ onNavigate }) {
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

  // Application is now independent from Navigation activation.
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
