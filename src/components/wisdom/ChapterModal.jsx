// src/components/wisdom/ChapterModal.jsx
// Extracted from WisdomSection.jsx — full-screen chapter reader with Prev/Next navigation
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { sanitizeText } from "../../utils/textUtils.js";
import { useWisdomStore } from "../../state/wisdomStore.js";

export function ChapterModal({
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
            maxWidth: "65ch",
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
