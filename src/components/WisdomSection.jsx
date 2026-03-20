// src/components/WisdomSection.jsx
import React, { useState, useEffect } from "react";
import { WisdomSelectionModal } from "./WisdomSelectionModal.jsx";
import { ChapterModal } from "./wisdom/ChapterModal.jsx";
import { PartAccordion } from "./wisdom/PartAccordion.jsx";
import { treatiseChapters } from "../data/treatise.generated.js";
import { treatiseParts, getChaptersForPart } from "../data/treatiseParts.js";
import { sanitizeText } from "../utils/textUtils.js";
import { VideoLibrary } from "./VideoLibrary.jsx";
import { SelfKnowledgeView } from "./wisdom/SelfKnowledgeView.jsx";
import { WisdomCardHousing } from "./wisdom/WisdomCardHousing.jsx";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useUiStore } from "../state/uiStore.js";
import { useWisdomStore } from "../state/wisdomStore.js";

const TABS = [
  "Treatise",
  "Bookmarks",
  "Videos",
  "Self-Knowledge",
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN COMPONENT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function WisdomSection() {
  // Theme context
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  // PROBE:wisdom-recommendations-removal:START
  const [activeTab, setActiveTab] = useState("Treatise");
  const [expandedPart, setExpandedPart] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalChapter, setModalChapter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTimeBudgetMin, setModalTimeBudgetMin] = useState(null);
  const [wisdomModalOpen, setWisdomModalOpen] = useState(false);
  const [initialVideoId, setInitialVideoId] = useState(null);
  const [initialVideoBudgetMin, setInitialVideoBudgetMin] = useState(null);
  const { bookmarks, addBookmark, removeBookmark } = useWisdomStore();
  const bookmarkedIds = bookmarks.map((b) => b.sectionId);
  const contentLaunchContext = useUiStore(s => s.contentLaunchContext);
  const clearContentLaunchContext = useUiStore(s => s.clearContentLaunchContext);

  // Theme configuration
  const THEME_CONFIG = isLight ? {
    containerBg: 'rgba(255, 250, 240, 0.95)',
    cardBg: 'rgba(255, 250, 240, 0.6)',
    textMain: 'rgba(80, 60, 40, 0.95)',
    textSub: 'rgba(80, 60, 40, 0.7)',
    border: 'var(--accent-20)',
    searchBg: 'rgba(255, 250, 240, 0.8)',
    searchText: 'rgba(80, 60, 40, 0.9)',
    searchPlaceholder: 'rgba(80, 60, 40, 0.4)',
  } : {
    containerBg: 'rgba(10, 10, 15, 0.95)',
    cardBg: 'rgba(26, 15, 28, 0.92)',
    textMain: 'rgba(253, 251, 245, 0.9)',
    textSub: 'rgba(253, 251, 245, 0.5)',
    border: 'var(--accent-15)',
    searchBg: 'rgba(0, 0, 0, 0.2)',
    searchText: 'rgba(253, 251, 245, 0.9)',
    searchPlaceholder: 'rgba(255, 255, 255, 0.4)',
  };

  const toggleBookmark = (chapterId) => {
    const exists = bookmarks.some((b) => b.sectionId === chapterId);
    if (exists) {
      removeBookmark(chapterId);
    } else {
      addBookmark({ sectionId: chapterId });
    }
  };

  const openChapterModal = (chapter, opts = {}) => {
    setModalChapter(chapter);
    setModalTimeBudgetMin(typeof opts.durationMin === 'number' ? opts.durationMin : null);
    setModalOpen(true);
  };

  const getChapterById = (id) => treatiseChapters.find((ch) => ch.id === id);

  // Consume content launch context (from paths/curriculum/navigation recommendations).
  useEffect(() => {
    if (!contentLaunchContext) return;

    try {
      if (contentLaunchContext.target === 'chapter' && contentLaunchContext.chapterId) {
        const ch = getChapterById(contentLaunchContext.chapterId);
        if (ch) {
          setActiveTab('Treatise');
          openChapterModal(ch, { durationMin: contentLaunchContext.durationMin });
        }
      } else if (contentLaunchContext.target === 'video' && contentLaunchContext.videoId) {
        setActiveTab('Videos');
        setInitialVideoId(contentLaunchContext.videoId);
        setInitialVideoBudgetMin(typeof contentLaunchContext.durationMin === 'number' ? contentLaunchContext.durationMin : null);
      }
    } finally {
      clearContentLaunchContext?.();
    }
  }, [contentLaunchContext, clearContentLaunchContext]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // TREATISE VIEW - Parts Accordion
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderTreatiseView = () => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    // Filter chapters if searching
    const filteredChapters = normalizedQuery
      ? treatiseChapters.filter((ch) => {
          const searchText = (
            ch.title +
            " " +
            (ch.subtitle || "") +
            " " +
            (ch.excerpt || "")
          ).toLowerCase();
          return searchText.includes(normalizedQuery);
        })
      : null;

    // If searching, show flat results
    if (filteredChapters) {
      return (
        <WisdomCardHousing
          className="space-y-5"
          cardId="wisdom:treatisePanel"
          contentClassName="space-y-5 px-5 py-5 sm:px-6 sm:py-6"
        >
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treatise..."
                className="wisdom-search w-full px-4 py-3 text-[13px]"
                style={{ 
                  color: THEME_CONFIG.searchText,
                  background: THEME_CONFIG.searchBg,
                  border: `1px solid ${THEME_CONFIG.border}`,
                }}
              />
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-3 rounded-xl text-[12px] border transition-all"
              style={{
                border: "1px solid var(--accent-20)",
                color: "rgba(253,251,245,0.6)",
              }}
            >
              Clear
            </button>
          </div>

          <div
            className="text-[11px]"
            style={{ color: "rgba(253,251,245,0.5)" }}
          >
            {filteredChapters.length} result
            {filteredChapters.length !== 1 ? "s" : ""} for "{searchQuery}"
          </div>

          <div className="space-y-3">
            {filteredChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => openChapterModal(ch)}
                className="w-full text-left px-4 py-3 rounded-xl border transition-all"
                style={{
                  background: "rgba(0,0,0,0.18)",
                  border: "1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.08)",
                }}
              >
                <div
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(253,251,245,0.85)" }}
                >
                  {sanitizeText(ch.title)}
                </div>
                {ch.subtitle && (
                  <div
                    className="text-[11px] mt-1"
                    style={{ color: "rgba(253,251,245,0.5)" }}
                  >
                    {sanitizeText(ch.subtitle)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </WisdomCardHousing>
      );
    }

    // Normal view - Parts accordion
    return (
      <WisdomCardHousing
        className="space-y-5"
        cardId="wisdom:treatisePanel"
        contentClassName="space-y-5 px-5 py-5 sm:px-6 sm:py-6"
      >
        {/* Header */}
        <div className="text-center pb-5 border-b border-[var(--accent-10)]">
          <h2
            className="text-[16px] uppercase mb-1"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              letterSpacing: "var(--tracking-mythic)",
              color: "var(--accent-color)",
            }}
          >
            The Treatise
          </h2>
          <p
            className="text-[12px] italic"
            style={{ color: "rgba(253,251,245,0.5)" }}
          >
            A Map of Conscious Living
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters..."
            className="wisdom-search w-full px-4 py-3 text-[13px]"
            style={{ 
              color: THEME_CONFIG.searchText,
              background: THEME_CONFIG.searchBg,
              border: `1px solid ${THEME_CONFIG.border}`,
            }}
          />
        </div>

        {/* Parts Accordion */}
        <div className="border border-[var(--accent-15)] rounded-2xl">
          {treatiseParts.map((part) => {
            const chapters = getChaptersForPart(part.id, treatiseChapters);
            return (
              <PartAccordion
                key={part.id}
                part={part}
                chapters={chapters}
                isExpanded={expandedPart === part.id}
                onToggle={() =>
                  setExpandedPart(expandedPart === part.id ? null : part.id)
                }
                onChapterClick={openChapterModal}
                bookmarkedIds={bookmarkedIds}
                onBookmark={toggleBookmark}
              />
            );
          })}
        </div>
      </WisdomCardHousing>
    );
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // BOOKMARKS VIEW - "The Stars" Constellation Builder
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderBookmarksView = () => {
    const bookmarkedChapters = treatiseChapters.filter((ch) =>
      bookmarkedIds.includes(ch.id),
    );

    // Empty state: Dark sky awaiting stars
    if (bookmarkedChapters.length === 0) {
      return (
        <WisdomCardHousing
          className="min-h-[300px]"
          cardId="wisdom:bookmarksPanel"
          contentClassName="relative min-h-[300px] flex flex-col items-center justify-center rounded-2xl overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(8,14,24,0.96) 0%, rgba(4,8,15,0.98) 100%)",
          }}
        >
          {/* Distant stars background */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 2 + 1 + "px",
                  height: Math.random() * 2 + 1 + "px",
                  left: Math.random() * 100 + "%",
                  top: Math.random() * 100 + "%",
                  background: "rgba(255,255,255,0.3)",
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: Math.random() * 2 + "s",
                }}
              />
            ))}
          </div>

          {/* Central message */}
          <div className="relative z-10 text-center">
            <div
              className="text-4xl mb-4"
              style={{
                filter: "drop-shadow(0 0 8px rgba(200,180,255,0.4))",
                animation: "pulse 3s ease-in-out infinite",
              }}
            >
              {"\u2727"}
            </div>
            <div
              className="text-[14px] italic mb-2"
              style={{
                fontFamily: "var(--font-body)",
                color: "rgba(200,180,255,0.7)",
                letterSpacing: "0.05em",
              }}
            >
              The sky is waiting for your stars
            </div>
            <div
              className="text-[11px]"
              style={{ color: "rgba(253,251,245,0.4)" }}
            >
              Bookmark chapters to build your constellation
            </div>
          </div>

          <style>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.8; }
            }
          `}</style>
        </WisdomCardHousing>
      );
    }

    // Constellation view: Stars with connecting lines
    return (
      <WisdomCardHousing
        className="min-h-[350px]"
        cardId="wisdom:bookmarksPanel"
        contentClassName="relative min-h-[350px] rounded-2xl p-6 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(8,14,24,0.96) 0%, rgba(4,8,15,0.99) 100%)",
        }}
      >
        {/* Distant stars background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 1.5 + 0.5 + "px",
                height: Math.random() * 1.5 + 0.5 + "px",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                background: "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>

        {/* Constellation lines (SVG connecting first few stars) */}
        {bookmarkedChapters.length > 1 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <defs>
              <linearGradient
                id="constellationLine"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="rgba(200,180,255,0.1)" />
                <stop offset="50%" stopColor="rgba(200,180,255,0.3)" />
                <stop offset="100%" stopColor="rgba(200,180,255,0.1)" />
              </linearGradient>
            </defs>
            {bookmarkedChapters.slice(0, -1).map((_, i) => {
              const y1 = 60 + i * 70;
              const y2 = 60 + (i + 1) * 70;
              const x1 = 20 + (i % 2) * 15;
              const x2 = 20 + ((i + 1) % 2) * 15;
              return (
                <line
                  key={i}
                  x1={`${x1}%`}
                  y1={y1}
                  x2={`${x2}%`}
                  y2={y2}
                  stroke="url(#constellationLine)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>
        )}

        {/* Stars (bookmarked chapters) */}
        <div className="relative z-10 space-y-4">
          {bookmarkedChapters.map((ch, index) => (
            <button
              key={ch.id}
              onClick={() => openChapterModal(ch)}
              className="w-full text-left px-4 py-3 rounded-xl transition-all group relative"
              style={{
                background: "rgba(20,15,40,0.6)",
                border: "1px solid rgba(200,180,255,0.15)",
                marginLeft: (index % 2) * 20 + "px",
                maxWidth: "calc(100% - 20px)",
              }}
            >
              {/* Star glow */}
              <div
                className="absolute -left-3 top-1/2 -translate-y-1/2 text-lg"
                style={{
                  color: "var(--accent-color)",
                  filter: "drop-shadow(0 0 6px var(--accent-glow))",
                }}
              >
                {"\u2605"}
              </div>

              <div className="flex items-start justify-between gap-3 pl-4">
                <div>
                  <div
                    className="text-[13px] font-medium group-hover:text-white transition-colors"
                    style={{ color: "rgba(253,251,245,0.85)" }}
                  >
                    {sanitizeText(ch.title)}
                  </div>
                  {ch.subtitle && (
                    <div
                      className="text-[11px] mt-1"
                      style={{ color: "rgba(253,251,245,0.5)" }}
                    >
                      {sanitizeText(ch.subtitle)}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(ch.id);
                  }}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: "rgba(255,200,200,0.8)" }}
                  title="Remove from constellation"
                >
                  {"\u2715"}
                </button>
              </div>
            </button>
          ))}
        </div>

        {/* Constellation count */}
        <div
          className="absolute bottom-4 right-4 text-[10px] uppercase tracking-wider"
          style={{ color: "rgba(200,180,255,0.4)" }}
        >
          {bookmarkedChapters.length} star
          {bookmarkedChapters.length !== 1 ? "s" : ""} in your sky
        </div>
      </WisdomCardHousing>
    );
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // VIDEOS VIEW - Now uses VideoLibrary component
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderVideosView = () => (
    <WisdomCardHousing
      cardId="wisdom:videosPanel"
      contentClassName="px-3 py-3 sm:px-4 sm:py-4"
    >
      <VideoLibrary
        initialVideoId={initialVideoId}
        initialVideoBudgetMin={initialVideoBudgetMin}
      />
    </WisdomCardHousing>
  );

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // MAIN RENDER
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <>
      <ChapterModal
        chapter={modalChapter}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalTimeBudgetMin(null);
        }}
        onBookmark={toggleBookmark}
        isBookmarked={modalChapter && bookmarkedIds.includes(modalChapter.id)}
        allChapters={treatiseChapters}
        onNavigate={(ch) => {
          setModalChapter(ch);
          setModalTimeBudgetMin(null);
        }}
        timeBudgetMin={modalTimeBudgetMin}
      />

      <div data-tutorial="wisdom-root" className="w-full max-w-5xl mx-auto">
        <div
          className="border border-[var(--accent-15)] backdrop-blur-xl px-7 pt-8 pb-9 space-y-5 relative"
          style={{
            background: "rgba(20, 10, 15, 0.78)",
            borderRadius: "var(--radius-panel)",
            boxShadow: "var(--shadow-panel)",
          }}
        >
          {/* Wisdom scroll background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(/wisdom - scroll.webp)`,
              backgroundSize: "contain",
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
              opacity: 0.17,
              zIndex: 0,
              borderRadius: "var(--radius-panel)",
            }}
          />
          {/* Wisdom Selector - Dropdown Style (matching practice menu) */}
          <div
            className="mb-6"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Text prompt above button */}
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "var(--tracking-mythic)",
                color: "rgba(253,251,245,0.5)",
                textTransform: "uppercase",
              }}
            >
              What do you need?
            </div>
            <button
              onClick={() => setWisdomModalOpen(true)}
              className="px-6 py-3 rounded-full im-nav-btn"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "var(--tracking-mythic)",
                color: "var(--accent-color)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
                border: "1px solid var(--accent-30)",
                boxShadow:
                  "0 0 25px var(--accent-15), inset 0 0 20px var(--accent-08)",
                transform: wisdomModalOpen ? "scale(1.06)" : "scale(1)",
                transition:
                  "transform 300ms ease-out, background 300ms ease-out, box-shadow 300ms ease-out",
              }}
            >
              <span>
                {activeTab}
                {activeTab === "Bookmarks" && bookmarkedIds.length > 0
                  ? ` (${bookmarkedIds.length})`
                  : ""}
              </span>
              {/* Chevron */}
              <span
                style={{
                  fontSize: "10px",
                  transform: wisdomModalOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 200ms ease-out",
                }}
              >
                {"\u25bc"}
              </span>
            </button>
          </div>

          {/* Content */}
          <section className="min-h-[400px] relative z-10">
            {activeTab === "Treatise" && renderTreatiseView()}
            {activeTab === "Bookmarks" && renderBookmarksView()}
            {activeTab === "Videos" && renderVideosView()}
            {activeTab === "Self-Knowledge" && <SelfKnowledgeView />}
          </section>
        </div>
      </div>

      {/* Wisdom Selection Modal */}
      <WisdomSelectionModal
        isOpen={wisdomModalOpen}
        onClose={() => setWisdomModalOpen(false)}
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        bookmarksCount={bookmarkedIds.length}
      />
      {/* PROBE:wisdom-recommendations-removal:END */}
    </>
  );
}
