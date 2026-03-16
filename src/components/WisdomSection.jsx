// src/components/WisdomSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { WisdomSelectionModal } from "./WisdomSelectionModal.jsx";
import ReactMarkdown from "react-markdown";
import { treatiseChapters } from "../data/treatise.generated.js";
import { treatiseParts, getChaptersForPart } from "../data/treatiseParts.js";
import { sanitizeText } from "../utils/textUtils.js";
import { VideoLibrary } from "./VideoLibrary.jsx";
import { SelfKnowledgeView } from "./wisdom/SelfKnowledgeView.jsx";
import { WisdomCardHousing } from "./wisdom/WisdomCardHousing.jsx";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useUiStore } from "../state/uiStore.js";

const TABS = [
  "Treatise",
  "Bookmarks",
  "Videos",
  "Self-Knowledge",
];
import { useWisdomStore } from "../state/wisdomStore.js";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CHAPTER MODAL - Enhanced with Prev/Next navigation
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChapterModal({
  chapter,
  isOpen,
  onClose,
  onBookmark,
  isBookmarked,
  allChapters,
  onNavigate,
  timeBudgetMin,
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const contentRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const mouseTimeoutRef = useRef(null);
  const readStartRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const { recordReadingSession, markSectionCompleted } = useWisdomStore();

  const currentIndex = allChapters.findIndex((ch) => ch.id === chapter?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allChapters.length - 1;

  // Check if near bottom for state-aware navigation (85% threshold)
  const isNearBottom = scrollProgress > 85;

  // Track reading progress & handle reading mode
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      const clamped = Math.min(100, Math.max(0, progress));
      scrollProgressRef.current = clamped;
      setScrollProgress(clamped);

      // Mark chapter as completed when user reaches the bottom zone.
      if (chapter && clamped >= 85) {
        markSectionCompleted?.(chapter.id, { source: 'scroll', scrollDepth: clamped / 100 });
      }

      // Enter reading mode on scroll
      setIsReadingMode(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      // Exit reading mode after 2s of no scroll
      scrollTimeoutRef.current = setTimeout(() => {
        setIsReadingMode(false);
      }, 2000);

      // Save scroll position to localStorage
      if (chapter) {
        localStorage.setItem(
          `treatise_progress_${chapter.id}`,
          scrollTop.toString(),
        );
      }
    };

    const el = contentRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => {
        el.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }
  }, [isOpen, chapter]);

  // Reading session lifecycle: record time spent and last scroll depth on close/unmount.
  useEffect(() => {
    if (!isOpen || !chapter) return;
    readStartRef.current = performance.now();
    scrollProgressRef.current = scrollProgressRef.current || 0;

    return () => {
      const startedAt = readStartRef.current;
      readStartRef.current = null;
      if (!chapter?.id || !startedAt) return;

      const seconds = Math.max(0, Math.round((performance.now() - startedAt) / 1000));
      if (seconds < 3) return; // ignore accidental opens

      const scrollDepth = Math.max(0, Math.min(1, (scrollProgressRef.current || 0) / 100));
      recordReadingSession?.({ sectionId: chapter.id, timeSpent: seconds, scrollDepth });

      if (scrollDepth >= 0.85) {
        markSectionCompleted?.(chapter.id, { source: 'read', scrollDepth });
      }
    };
  }, [isOpen, chapter?.id, recordReadingSession, markSectionCompleted]);

  // Mouse movement detection for reading mode
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = () => {
      setIsReadingMode(false);

      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);

      mouseTimeoutRef.current = setTimeout(() => {
        setIsReadingMode(true);
      }, 3000);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
    };
  }, [isOpen]);

  // Resume memory - restore scroll position
  useEffect(() => {
    if (!isOpen || !chapter || !contentRef.current) return;

    const savedPos = localStorage.getItem(`treatise_progress_${chapter.id}`);
    if (savedPos) {
      const scrollPos = parseInt(savedPos, 10);
      // Delay to ensure content is rendered
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = scrollPos;
        }
      }, 100);
    }
  }, [isOpen, chapter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev)
        onNavigate(allChapters[currentIndex - 1]);
      if (e.key === "ArrowRight" && hasNext)
        onNavigate(allChapters[currentIndex + 1]);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [
    isOpen,
    onClose,
    hasPrev,
    hasNext,
    currentIndex,
    allChapters,
    onNavigate,
  ]);

  if (!isOpen || !chapter) return null;

  const sanitizedTitle = sanitizeText(chapter.title || "");
  const sanitizedSubtitle = sanitizeText(chapter.subtitle || "");
  const sanitizedExcerpt = sanitizeText(chapter.excerpt || "");
  const sanitizedBody = sanitizeText(chapter.body || "");

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ animation: "fadeIn 300ms ease-out" }}
    >
      <div
        className="bg-[#0a0a12] border border-[var(--accent-20)] rounded-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative im-card"
        data-card="true"
        data-card-id="chapter-modal"
        style={{ 
          animation: "scaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          maxWidth: 'var(--ui-rail-max, min(430px, 94vw))'
        }}
      >
        {/* Vertical Progress Rail - right edge */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[3px] pointer-events-none z-20"
          style={{
            background: "rgba(198, 90, 255, 0.08)",
          }}
        >
          {/* Progress indicator dot */}
          <div
            className="absolute right-0 w-[8px] h-[8px] rounded-full transition-all duration-150"
            style={{
              top: `${scrollProgress}%`,
              transform: "translateX(50%) translateY(-50%)",
              background: "var(--accent-color)",
              boxShadow: "0 0 8px var(--accent-color)",
            }}
          />
        </div>
        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-[3px] transition-all duration-150 z-10"
          style={{
            width: `${scrollProgress}% `,
            background: "var(--accent-color)",
            boxShadow: "0 0 12px var(--accent-color)",
          }}
        />

        {/* Header - fades in reading mode */}
        <div
          className="border-b border-[var(--accent-15)] py-5 flex items-center justify-between gap-4 flex-shrink-0 transition-opacity duration-500"
          style={{ 
            opacity: isReadingMode ? 0.3 : 1,
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
          <div
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ color: "rgba(253,251,245,0.5)" }}
          >
            Chapter {currentIndex + 1} of {allChapters.length}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBookmark(chapter.id)}
              className="text-lg transition-all"
              style={{
                color: isBookmarked
                  ? "var(--accent-color)"
                  : "rgba(253,251,245,0.4)",
              }}
            >
              {isBookmarked ? "\u2605" : "\u2606"}
            </button>
            <button
              onClick={onClose}
              className="text-xl w-9 h-9 flex items-center justify-center rounded-full transition-all"
              style={{ color: "rgba(253,251,245,0.5)" }}
            >
              {"\u2715"}
            </button>
          </div>
        </div>

        {/* Title section - increased breathing space */}
        <div 
          className="pt-[100px] pb-[80px] text-center"
          style={{
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <h2
            className="text-2xl font-semibold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--accent-color)",
              letterSpacing: "var(--tracking-tight)",
              textShadow: "0 1px 4px rgba(0,0,0,0.65)",
            }}
          >
            {sanitizedTitle}
          </h2>
          {sanitizedSubtitle && (
            <p
              className="text-sm italic"
              style={{
                color: "rgba(253,251,245,0.6)",
                fontFamily: "var(--font-body)",
              }}
            >
              {sanitizedSubtitle}
            </p>
          )}
          {typeof timeBudgetMin === 'number' && (
            <div
              className="mt-3 text-[10px] uppercase tracking-[0.24em]"
              style={{ color: "rgba(253,251,245,0.55)", fontFamily: "var(--font-ui)" }}
            >
              Suggested time: {timeBudgetMin} min
            </div>
          )}
          {/* Refined divider - 60% width, thinner, centered */}
          <div
            className="mt-8 mx-auto"
            style={{
              width: "60%",
              height: "0.5px",
              background:
                "linear-gradient(90deg, transparent, var(--accent-color), transparent)",
              opacity: 0.3,
            }}
          />
        </div>

        {/* Content - narrower column for better readability */}
        <div
          ref={contentRef}
          className="py-8 prose-content"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: '15px',
            lineHeight: "1.7",
            color: "rgba(253,251,245,0.92)",
            maxWidth: "65ch", // ~70-80 chars max line length
            margin: "0 auto",
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          {sanitizedExcerpt && (
            <blockquote
              className="border-l-2 pl-6 py-4 my-6 italic mechanism-text"
              style={{
                borderColor: "var(--accent-40)",
                backgroundColor: "var(--accent-10)",
                borderRadius: "0 8px 8px 0",
                fontSize: "16px",
                opacity: 0.9,
              }}
            >
              <ReactMarkdown>{sanitizedExcerpt}</ReactMarkdown>
            </blockquote>
          )}
          {sanitizedBody ? (
            <div className="markdown-content">
              {/* First paragraph has gentle opacity reduction */}
              <div style={{ opacity: 0.85, marginBottom: "1.5em" }}>
                <ReactMarkdown>{sanitizedBody.split("\n\n")[0]}</ReactMarkdown>
              </div>
              {/* Rest of content */}
              <ReactMarkdown>
                {sanitizedBody.split("\n\n").slice(1).join("\n\n")}
              </ReactMarkdown>
            </div>
          ) : (
            <div
              className="text-center py-12"
              style={{ color: "rgba(253,251,245,0.4)" }}
            >
              No content available.
            </div>
          )}
        </div>

        {/* Footer with navigation - state-aware (shows more prominently near bottom or on interaction) */}
        <div
          className="border-t border-[var(--accent-15)] py-4 flex items-center justify-between flex-shrink-0 transition-all duration-500"
          style={{
            opacity: isReadingMode && !isNearBottom ? 0.2 : 1,
            transform:
              isReadingMode && !isNearBottom
                ? "translateY(4px)"
                : "translateY(0)",
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
          <button
            onClick={() => hasPrev && onNavigate(allChapters[currentIndex - 1])}
            className="px-4 py-2 rounded-full text-sm transition-all"
            style={{
              opacity: hasPrev ? 1 : 0.3,
              cursor: hasPrev ? "pointer" : "default",
              border: "1px solid var(--accent-20)",
              color: "rgba(253,251,245,0.7)",
            }}
            disabled={!hasPrev}
          >
            {"\u2190"} Previous
          </button>
          <div
            className="text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "rgba(253,251,245,0.4)" }}
          >
            Press {"\u2190"} {"\u2192"} to navigate {"\u2022"} Esc to close
          </div>
          <button
            onClick={() => hasNext && onNavigate(allChapters[currentIndex + 1])}
            className="px-4 py-2 rounded-full text-sm transition-all"
            style={{
              opacity: hasNext ? 1 : 0.3,
              cursor: hasNext ? "pointer" : "default",
              border: "1px solid var(--accent-20)",
              color: "rgba(253,251,245,0.7)",
            }}
            disabled={!hasNext}
          >
            Next {"\u2192"}
          </button>
        </div>
      </div>

      <style>{`
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

/* Enhanced markdown styling with custom dividers and list styles */
.markdown-content h1, .markdown-content h2, .markdown-content h3 {
  font-family: var(--font-display);
  color: var(--accent-color);
  margin-top: 2.5em;
  margin-bottom: 0.9em;
}

.markdown-content h2 { 
  font-size: 1.5em; 
  border-bottom: none;
  padding-bottom: 0.4em; 
}

/* Horizontal dividers as breath pauses */
.markdown-content hr {
  width: 60%;
  height: 0.5px;
  margin: 3em auto;
  border: none;
  background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
  opacity: 0.3;
}

.markdown-content p { 
  margin: 1em 0; 
}

/* First paragraph styling - already handled inline but keeping for fallback */
.markdown-content > p:first-of-type {
  opacity: 0.85;
}

/* Mechanism/secondary text styling (blockquotes as proxy) */
.markdown-content blockquote,
.mechanism-text {
  border-left: 2px solid var(--accent-40);
  background: var(--accent-10);
  padding: 1em 1.5em;
  margin: 1.5em 0;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  font-size: 0.92em;
  line-height: 1.5;
  opacity: 0.9;
}

/* Custom list styling with subtle visual anchors */
.markdown-content ul {
  list-style: none;
  padding-left: 1.5em;
}

.markdown-content ul li {
  position: relative;
  margin: 0.8em 0;
  padding-left: 1em;
}

.markdown-content ul li::before {
  content: "~";
  position: absolute;
  left: -0.3em;
  color: var(--accent-color);
  font-size: 0.8em;
  opacity: 0.5;
}

.markdown-content ol {
  padding-left: 1.8em;
}

.markdown-content ol li {
  margin: 0.8em 0;
}

/* Scrollbar styling */
.prose-content::-webkit-scrollbar { 
  width: 6px; 
}

.prose-content::-webkit-scrollbar-track { 
  background: rgba(0, 0, 0, 0.2); 
  border-radius: 3px; 
}

.prose-content::-webkit-scrollbar-thumb { 
  background: var(--accent-20); 
  border-radius: 3px; 
  transition: background 0.3s;
}

.prose-content::-webkit-scrollbar-thumb:hover { 
  background: var(--accent-30); 
}
`}</style>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PART ACCORDION - Collapsible Parts for Treatise
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PartAccordion({
  part,
  chapters,
  isExpanded,
  onToggle,
  onChapterClick,
  bookmarkedIds,
  onBookmark,
}) {
  const chapterCount = chapters.length;
  const rangeText = part.chapterRange
    ? `Ch ${part.chapterRange[0]}\u2013${part.chapterRange[1]} `
    : "";

  return (
    <div className="border-b border-[var(--accent-10)]">
      {/* Part Header */}
      <button
        onClick={chapterCount > 0 ? onToggle : undefined}
        disabled={chapterCount === 0}
        className="w-full px-5 py-4 flex items-center justify-between text-left transition-all hover:bg-[var(--accent-05)]"
        style={{
          background: isExpanded ? "var(--accent-05)" : "transparent",
          cursor: chapterCount === 0 ? "default" : "pointer",
          opacity: chapterCount === 0 ? 0.5 : 1
        }}
      >
        <div className="flex items-center gap-3">
          {chapterCount > 0 && (
            <span
              className="text-[11px] transition-transform"
              style={{
                color: "var(--accent-color)",
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              {"\u203a"}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              {part.number && (
                <span
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: "var(--accent-color)", opacity: 0.5 }}
                >
                  Part {part.number}
                </span>
              )}
              <span
                className="text-[13px] font-medium line-clamp-2"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "rgba(253,251,245,0.9)",
                }}
              >
                {part.title}
              </span>
            </div>
            {part.subtitle && (
              <div
                className="text-[11px] mt-0.5"
                style={{
                  color: "rgba(253,251,245,0.5)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {part.subtitle}
              </div>
            )}
          </div>
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.15em]"
          style={{ color: "rgba(253,251,245,0.4)" }}
        >
          {chapterCount === 0 ? "Coming soon" : (rangeText || `${chapterCount} items`)}
        </div>
      </button>

      {/* Expanded Chapters */}
      {isExpanded && (
        <div
          className="px-5 pb-4 space-y-3"
          style={{ animation: "slideDown 200ms ease-out" }}
        >
          {chapters.map((ch) => {
            const isBookmarked = bookmarkedIds.includes(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => onChapterClick(ch)}
                className="w-full text-left px-4 py-3 rounded-xl border transition-all group"
                style={{
                  background: "rgba(0,0,0,0.18)",
                  border: "1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.08)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px]"
                        style={{ color: "hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.7)" }}
                      >
                        {typeof ch.order === "number" ? ch.order : ch.order}
                      </span>
                      <span
                        className="text-[13px] font-medium group-hover:text-white transition-colors line-clamp-2"
                        style={{
                          color: "rgba(253,251,245,0.85)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {sanitizeText(ch.title)}
                      </span>
                    </div>
                    {ch.subtitle && (
                      <div
                        className="text-[11px] mt-1 ml-6"
                        style={{ color: "rgba(253,251,245,0.5)" }}
                      >
                        {sanitizeText(ch.subtitle)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmark(ch.id);
                    }}
                    className="text-sm transition-all flex-shrink-0"
                    style={{
                      color: isBookmarked
                        ? "var(--accent-color)"
                        : "rgba(253,251,245,0.3)",
                    }}
                  >
                    {isBookmarked ? "\u2605" : "\u2606"}
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
@keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
}
`}</style>
    </div>
  );
}

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
