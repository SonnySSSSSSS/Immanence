// src/components/WisdomSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { WisdomSelectionModal } from './WisdomSelectionModal.jsx';
import ReactMarkdown from "react-markdown";
import { treatiseChapters } from "../data/treatise.generated.js";
import { treatiseParts, getChaptersForPart } from "../data/treatiseParts.js";
import { wisdomCategories, getAllCategories } from "../data/wisdomRecommendations.js";
import { sanitizeText } from "../utils/textUtils.js";
import { VideoLibrary } from "./VideoLibrary.jsx";

const TABS = ["Recommendations", "Treatise", "Bookmarks", "Videos"];
import { useWisdomStore } from "../state/wisdomStore.js";



// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER MODAL - Enhanced with Prev/Next navigation
// ─────────────────────────────────────────────────────────────────────────────
function ChapterModal({ chapter, isOpen, onClose, onBookmark, isBookmarked, allChapters, onNavigate }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const contentRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const mouseTimeoutRef = useRef(null);

  const currentIndex = allChapters.findIndex(ch => ch.id === chapter?.id);
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
      setScrollProgress(Math.min(100, Math.max(0, progress)));

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
        localStorage.setItem(`treatise_progress_${chapter.id}`, scrollTop.toString());
      }
    };

    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => {
        el.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }
  }, [isOpen, chapter]);

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

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
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
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(allChapters[currentIndex - 1]);
      if (e.key === "ArrowRight" && hasNext) onNavigate(allChapters[currentIndex + 1]);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose, hasPrev, hasNext, currentIndex, allChapters, onNavigate]);

  if (!isOpen || !chapter) return null;

  const sanitizedTitle = sanitizeText(chapter.title || '');
  const sanitizedSubtitle = sanitizeText(chapter.subtitle || '');
  const sanitizedExcerpt = sanitizeText(chapter.excerpt || '');
  const sanitizedBody = sanitizeText(chapter.body || '');

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ animation: 'fadeIn 300ms ease-out' }}
    >
      <div
        className="bg-[#0a0a12] border border-[var(--accent-20)] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative"
        style={{ animation: 'scaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Vertical Progress Rail - right edge */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[3px] pointer-events-none z-20"
          style={{
            background: 'rgba(198, 90, 255, 0.08)',
          }}
        >
          {/* Progress indicator dot */}
          <div
            className="absolute right-0 w-[8px] h-[8px] rounded-full transition-all duration-150"
            style={{
              top: `${scrollProgress}%`,
              transform: 'translateX(50%) translateY(-50%)',
              background: 'var(--accent-color)',
              boxShadow: '0 0 8px var(--accent-color)',
            }}
          />
        </div>
        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-[3px] transition-all duration-150 z-10"
          style={{
            width: `${scrollProgress}% `,
            background: 'var(--accent-color)',
            boxShadow: '0 0 12px var(--accent-color)'
          }}
        />

        {/* Header - fades in reading mode */}
        <div
          className="border-b border-[var(--accent-15)] px-8 py-5 flex items-center justify-between gap-4 flex-shrink-0 transition-opacity duration-500"
          style={{ opacity: isReadingMode ? 0.3 : 1 }}
        >
          <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'rgba(253,251,245,0.5)' }}>
            Chapter {currentIndex + 1} of {allChapters.length}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBookmark(chapter.id)}
              className="text-lg transition-all"
              style={{ color: isBookmarked ? 'var(--accent-color)' : 'rgba(253,251,245,0.4)' }}
            >
              {isBookmarked ? "★" : "☆"}
            </button>
            <button
              onClick={onClose}
              className="text-xl w-9 h-9 flex items-center justify-center rounded-full transition-all"
              style={{ color: 'rgba(253,251,245,0.5)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Title section - increased breathing space */}
        <div className="px-12 pt-[100px] pb-[80px] text-center">
          <h2
            className="text-2xl font-semibold mb-2"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: 'var(--accent-color)',
              letterSpacing: '0.03em',
              textShadow: '0 1px 4px rgba(0,0,0,0.65)',
            }}
          >
            {sanitizedTitle}
          </h2>
          {sanitizedSubtitle && (
            <p className="text-sm italic" style={{ color: 'rgba(253,251,245,0.6)', fontFamily: 'Crimson Pro, Georgia, serif' }}>
              {sanitizedSubtitle}
            </p>
          )}
          {/* Refined divider - 60% width, thinner, centered */}
          <div
            className="mt-8 mx-auto"
            style={{
              width: '60%',
              height: '0.5px',
              background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)',
              opacity: 0.3
            }}
          />
        </div>

        {/* Content - narrower column for better readability */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-12 py-8 prose-content"
          style={{
            fontFamily: 'Crimson Pro, Georgia, serif',
            fontSize: '17px',
            lineHeight: '1.7',
            color: 'rgba(253,251,245,0.92)',
            maxWidth: '65ch', // ~70-80 chars max line length
            margin: '0 auto',
          }}
        >
          {sanitizedExcerpt && (
            <blockquote
              className="border-l-2 pl-6 py-4 my-6 italic mechanism-text"
              style={{
                borderColor: 'var(--accent-40)',
                backgroundColor: 'var(--accent-10)',
                borderRadius: '0 8px 8px 0',
                fontSize: '16px',
                opacity: 0.9
              }}
            >
              <ReactMarkdown>{sanitizedExcerpt}</ReactMarkdown>
            </blockquote>
          )}
          {sanitizedBody ? (
            <div className="markdown-content">
              {/* First paragraph has gentle opacity reduction */}
              <div style={{ opacity: 0.85, marginBottom: '1.5em' }}>
                <ReactMarkdown>
                  {sanitizedBody.split('\n\n')[0]}
                </ReactMarkdown>
              </div>
              {/* Rest of content */}
              <ReactMarkdown>
                {sanitizedBody.split('\n\n').slice(1).join('\n\n')}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12" style={{ color: 'rgba(253,251,245,0.4)' }}>No content available.</div>
          )}
        </div>

        {/* Footer with navigation - state-aware (shows more prominently near bottom or on interaction) */}
        <div
          className="border-t border-[var(--accent-15)] px-8 py-4 flex items-center justify-between flex-shrink-0 transition-all duration-500"
          style={{
            opacity: isReadingMode && !isNearBottom ? 0.2 : 1,
            transform: isReadingMode && !isNearBottom ? 'translateY(4px)' : 'translateY(0)'
          }}
        >
          <button
            onClick={() => hasPrev && onNavigate(allChapters[currentIndex - 1])}
            className="px-4 py-2 rounded-full text-sm transition-all"
            style={{
              opacity: hasPrev ? 1 : 0.3,
              cursor: hasPrev ? 'pointer' : 'default',
              border: '1px solid var(--accent-20)',
              color: 'rgba(253,251,245,0.7)'
            }}
            disabled={!hasPrev}
          >
            ← Previous
          </button>
          <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'rgba(253,251,245,0.4)' }}>
            Press ← → to navigate • Esc to close
          </div>
          <button
            onClick={() => hasNext && onNavigate(allChapters[currentIndex + 1])}
            className="px-4 py-2 rounded-full text-sm transition-all"
            style={{
              opacity: hasNext ? 1 : 0.3,
              cursor: hasNext ? 'pointer' : 'default',
              border: '1px solid var(--accent-20)',
              color: 'rgba(253,251,245,0.7)'
            }}
            disabled={!hasNext}
          >
            Next →
          </button>
        </div>
      </div>

      <style>{`
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

/* Enhanced markdown styling with custom dividers and list styles */
.markdown-content h1, .markdown-content h2, .markdown-content h3 {
  font-family: 'Cinzel', Georgia, serif;
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

// ─────────────────────────────────────────────────────────────────────────────
// PART ACCORDION - Collapsible Parts for Treatise
// ─────────────────────────────────────────────────────────────────────────────
function PartAccordion({ part, chapters, isExpanded, onToggle, onChapterClick, bookmarkedIds, onBookmark }) {
  const chapterCount = chapters.length;
  const rangeText = part.chapterRange ? `Ch ${part.chapterRange[0]}–${part.chapterRange[1]} ` : '';

  return (
    <div className="border-b border-[var(--accent-10)]">
      {/* Part Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left transition-all hover:bg-[var(--accent-05)]"
        style={{ background: isExpanded ? 'var(--accent-05)' : 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] transition-transform" style={{ color: 'var(--accent-color)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
          <div>
            <div className="flex items-center gap-2">
              {part.number && (
                <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--accent-color)' }}>
                  Part {part.number}
                </span>
              )}
              <span className="text-[13px] font-medium" style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'rgba(253,251,245,0.9)' }}>
                {part.title}
              </span>
            </div>
            {part.subtitle && (
              <div className="text-[11px] mt-0.5" style={{ color: 'rgba(253,251,245,0.5)', fontFamily: 'Crimson Pro, Georgia, serif' }}>
                {part.subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'rgba(253,251,245,0.4)' }}>
          {rangeText || `${chapterCount} items`}
        </div>
      </button>

      {/* Expanded Chapters */}
      {isExpanded && (
        <div className="px-5 pb-4 space-y-2" style={{ animation: 'slideDown 200ms ease-out' }}>
          {chapters.map((ch) => {
            const isBookmarked = bookmarkedIds.includes(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => onChapterClick(ch)}
                className="w-full text-left px-4 py-3 rounded-xl border transition-all group"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--accent-10)'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: 'var(--accent-color)' }}>
                        {typeof ch.order === 'number' ? ch.order : ch.order}
                      </span>
                      <span className="text-[13px] font-medium group-hover:text-white transition-colors" style={{ color: 'rgba(253,251,245,0.85)', fontFamily: 'Crimson Pro, Georgia, serif' }}>
                        {sanitizeText(ch.title)}
                      </span>
                    </div>
                    {ch.subtitle && (
                      <div className="text-[11px] mt-1 ml-6" style={{ color: 'rgba(253,251,245,0.5)' }}>
                        {sanitizeText(ch.subtitle)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onBookmark(ch.id); }}
                    className="text-sm transition-all flex-shrink-0"
                    style={{ color: isBookmarked ? 'var(--accent-color)' : 'rgba(253,251,245,0.3)' }}
                  >
                    {isBookmarked ? "★" : "☆"}
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

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY SIGIL - Archetypal visual anchors
// ─────────────────────────────────────────────────────────────────────────────
function CategorySigil({ categoryKey }) {
  const SIGIL_MAP = {
    'focus-presence': 'focus-presence.png',
    'emotional-regulation': 'emotional-regulation.png',
    'grounding-safety': 'grounding-safety.png',
    'shadow-integration': 'shadow-integration.png',
    'expression-voice': 'expression-voice.png',
    'heart-connection': 'heart-connection.png',
    'resonance-alignment': 'resonance-alignment.png',
    'self-knowledge': 'self-knowledge.png',
  };

  // Use PNG if available, otherwise SVG placeholder
  if (SIGIL_MAP[categoryKey]) {
    return (
      <img
        src={`${import.meta.env.BASE_URL} sigils / ${SIGIL_MAP[categoryKey]} `}
        alt=""
        className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '80px',
          height: '80px',
          opacity: 0.16,
          filter: 'blur(0.5px)',
          zIndex: 1
        }}
      />
    );
  }

  // SVG placeholders for remaining sigils
  const SVG_SIGILS = {
    'shadow-integration': (
      <svg width="80" height="80" viewBox="0 0 80 80" className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ opacity: 0.16, zIndex: 1 }}>
        <circle cx="40" cy="40" r="20" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
        <circle cx="48" cy="40" r="20" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
      </svg>
    ),
    'expression-voice': (
      <svg width="80" height="80" viewBox="0 0 80 80" className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ opacity: 0.16, zIndex: 1 }}>
        <circle cx="40" cy="40" r="3" fill="var(--accent-color)" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line key={angle} x1="40" y1="40" x2={40 + Math.cos(angle * Math.PI / 180) * 25} y2={40 + Math.sin(angle * Math.PI / 180) * 25} stroke="var(--accent-color)" strokeWidth="1.5" />
        ))}
      </svg>
    ),
    'heart-connection': (
      <svg width="80" height="80" viewBox="0 0 80 80" className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ opacity: 0.16, zIndex: 1 }}>
        <circle cx="35" cy="40" r="18" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
        <circle cx="45" cy="40" r="18" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
      </svg>
    ),
    'resonance-alignment': (
      <svg width="80" height="80" viewBox="0 0 80 80" className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ opacity: 0.16, zIndex: 1 }}>
        <path d="M20,40 Q30,25 40,40 T60,40" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
        <path d="M20,40 Q30,55 40,40 T60,40" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
      </svg>
    ),
    'self-knowledge': (
      <svg width="80" height="80" viewBox="0 0 80 80" className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ opacity: 0.16, zIndex: 1 }}>
        <circle cx="40" cy="40" r="25" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="15" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="5" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
      </svg>
    ),
  };

  return SVG_SIGILS[categoryKey] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CARD - For Recommendations
// ─────────────────────────────────────────────────────────────────────────────
function CategoryCard({ category, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative p-4 rounded-2xl border text-left transition-all overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
        border: '1px solid transparent',
        backgroundImage: isSelected
          ? `linear - gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
  linear - gradient(135deg, var(--accent - 50) 0 %, var(--accent - 40) 50 %, var(--accent - 50) 100 %)`
          : `linear - gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
  linear - gradient(135deg, var(--accent - 40) 0 %, rgba(138, 43, 226, 0.2) 50 %, var(--accent - 30) 100 %)`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: isSelected
          ? `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent - 25), 0 0 80px var(--accent - 10), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 - 3px 12px rgba(0, 0, 0, 0.4)`
          : '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-15), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)',
        minHeight: '140px'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px var(--accent-20), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-15), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)';
        }
      }}
    >
      {/* Symbolic sigil anchor - quiet archetypal visual */}
      <CategorySigil categoryKey={category.key} />

      {/* Volcanic glass texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `
radial - gradient(circle at 30 % 20 %, rgba(255, 255, 255, 0.02) 0 %, transparent 50 %),
  repeating - linear - gradient(45deg, transparent, transparent 3px, rgba(0, 0, 0, 0.015) 3px, rgba(0, 0, 0, 0.015) 6px)
    `,
          opacity: 0.7
        }}
      />

      {/* Inner glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `radial - gradient(circle at 50 % 0 %, ${isSelected ? 'var(--accent-glow)15' : 'var(--accent-glow)08'} 0 %, transparent 60 %)`
        }}
      />

      <div className="relative z-10">
        <div className="mb-3">
          <span
            className="text-[12px] font-medium uppercase tracking-[0.08em] leading-tight"
            style={{ color: 'var(--accent-color)' }}
          >
            {category.label}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {category.symptoms.map((symptom, i) => (
            <span
              key={i}
              className="text-[11px]"
              style={{ color: 'rgba(253,251,245,0.55)' }}
            >
              {symptom}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function WisdomSection() {
  const [activeTab, setActiveTab] = useState("Recommendations");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedPart, setExpandedPart] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalChapter, setModalChapter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [wisdomModalOpen, setWisdomModalOpen] = useState(false);
  const { bookmarks, addBookmark, removeBookmark } = useWisdomStore();
  const bookmarkedIds = bookmarks.map(b => b.sectionId);

  const toggleBookmark = (chapterId) => {
    const exists = bookmarks.some(b => b.sectionId === chapterId);
    if (exists) {
      removeBookmark(chapterId);
    } else {
      addBookmark({ sectionId: chapterId });
    }
  };

  const openChapterModal = (chapter) => {
    setModalChapter(chapter);
    setModalOpen(true);
  };

  const getChapterById = (id) => treatiseChapters.find(ch => ch.id === id);

  // ─────────────────────────────────────────────────────────────────────────
  // RECOMMENDATIONS VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const renderRecommendationsView = () => {
    const categories = getAllCategories();
    const currentCategory = selectedCategory ? wisdomCategories[selectedCategory] : null;

    if (currentCategory) {
      // Expanded view - show back button and recommendations
      return (
        <div className="space-y-5">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm transition-all"
            style={{ color: 'var(--accent-color)' }}
          >
            <span>◀</span>
            <span className="uppercase tracking-[0.15em]">{currentCategory.label}</span>
          </button>

          <div className="text-[14px] italic leading-relaxed" style={{ color: 'rgba(253,251,245,0.7)', fontFamily: 'Crimson Pro, Georgia, serif' }}>
            {currentCategory.description}
          </div>

          <div className="border-t border-[var(--accent-15)] pt-5 space-y-4">
            {currentCategory.chapters.map((rec, idx) => {
              const chapter = getChapterById(rec.chapterRef);
              const isBookmarked = chapter && bookmarkedIds.includes(chapter.id);

              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border cursor-pointer transition-all group"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--accent-15)', borderLeft: '3px solid var(--accent-30)' }}
                  onClick={() => chapter && openChapterModal(chapter)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-[15px] font-semibold group-hover:text-white transition-colors" style={{ fontFamily: 'Crimson Pro, Georgia, serif', color: 'rgba(253,251,245,0.9)' }}>
                      {sanitizeText(rec.title)}
                    </h3>
                    {chapter && (
                      <button onClick={(e) => { e.stopPropagation(); toggleBookmark(chapter.id); }} style={{ color: isBookmarked ? 'var(--accent-color)' : 'rgba(253,251,245,0.3)' }}>
                        {isBookmarked ? "★" : "☆"}
                      </button>
                    )}
                  </div>
                  <div className="text-[13px] leading-relaxed" style={{ color: 'rgba(253,251,245,0.6)' }}>
                    <span style={{ color: 'var(--accent-color)' }}>Why: </span>
                    {sanitizeText(rec.reasoning)}
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-[11px] uppercase tracking-[0.15em]" style={{ color: 'var(--accent-color)' }}>
                      Read Chapter →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Category selection grid - transformed into symbolic field
    return (
      <div className="space-y-6">
        {/* Ritual threshold - invocation framing */}
        <div className="flex items-center justify-center gap-3 px-8">
          {/* Left sigil divider */}
          <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-40">
            <circle cx="5" cy="5" r="1.5" fill="var(--accent-color)" />
            <path d="M5 0 L5 3 M5 7 L5 10 M0 5 L3 5 M7 5 L10 5" stroke="var(--accent-color)" strokeWidth="0.5" opacity="0.5" />
          </svg>

          {/* Question as invocation */}
          <h2 className="text-[15px] uppercase tracking-[0.28em] px-2" style={{ color: 'rgba(253,251,245,0.62)', letterSpacing: '0.28em' }}>
            What Do You Need?
          </h2>

          {/* Right sigil divider */}
          <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-40">
            <circle cx="5" cy="5" r="1.5" fill="var(--accent-color)" />
            <path d="M5 0 L5 3 M5 7 L5 10 M0 5 L3 5 M7 5 L10 5" stroke="var(--accent-color)" strokeWidth="0.5" opacity="0.5" />
          </svg>
        </div>

        {/* Card grid as field - subtle vertical gradient */}
        <div
          className="p-4 rounded-3xl"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.15) 100%)',
            border: '1px solid rgba(198, 90, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.key}
                category={cat}
                isSelected={selectedCategory === cat.key}
                onClick={() => setSelectedCategory(cat.key)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TREATISE VIEW - Parts Accordion
  // ─────────────────────────────────────────────────────────────────────────
  const renderTreatiseView = () => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    // Filter chapters if searching
    const filteredChapters = normalizedQuery
      ? treatiseChapters.filter(ch => {
        const searchText = (ch.title + " " + (ch.subtitle || "") + " " + (ch.excerpt || "")).toLowerCase();
        return searchText.includes(normalizedQuery);
      })
      : null;

    // If searching, show flat results
    if (filteredChapters) {
      return (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treatise..."
                className="wisdom-search w-full px-4 py-3 text-[13px] placeholder:text-white/40"
                style={{ color: 'rgba(253,251,245,0.9)' }}
              />
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-3 rounded-xl text-[12px] border transition-all"
              style={{ border: '1px solid var(--accent-20)', color: 'rgba(253,251,245,0.6)' }}
            >
              Clear
            </button>
          </div>

          <div className="text-[11px]" style={{ color: 'rgba(253,251,245,0.5)' }}>
            {filteredChapters.length} result{filteredChapters.length !== 1 ? 's' : ''} for "{searchQuery}"
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredChapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => openChapterModal(ch)}
                className="w-full text-left px-4 py-3 rounded-xl border transition-all"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--accent-10)' }}
              >
                <div className="text-[13px] font-medium" style={{ color: 'rgba(253,251,245,0.85)' }}>
                  {sanitizeText(ch.title)}
                </div>
                {ch.subtitle && <div className="text-[11px] mt-1" style={{ color: 'rgba(253,251,245,0.5)' }}>{sanitizeText(ch.subtitle)}</div>}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Normal view - Parts accordion
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center pb-4 border-b border-[var(--accent-10)]">
          <h2 className="text-[16px] uppercase tracking-[0.3em] mb-1" style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'var(--accent-color)' }}>
            The Treatise
          </h2>
          <p className="text-[12px] italic" style={{ color: 'rgba(253,251,245,0.5)' }}>
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
            className="wisdom-search w-full px-4 py-3 text-[13px] placeholder:text-white/40"
            style={{ color: 'rgba(253,251,245,0.9)' }}
          />
        </div>

        {/* Parts Accordion */}
        <div className="border border-[var(--accent-15)] rounded-2xl overflow-hidden max-h-[450px] overflow-y-auto">
          {treatiseParts.map((part) => {
            const chapters = getChaptersForPart(part.id, treatiseChapters);
            return (
              <PartAccordion
                key={part.id}
                part={part}
                chapters={chapters}
                isExpanded={expandedPart === part.id}
                onToggle={() => setExpandedPart(expandedPart === part.id ? null : part.id)}
                onChapterClick={openChapterModal}
                bookmarkedIds={bookmarkedIds}
                onBookmark={toggleBookmark}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // BOOKMARKS VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const renderBookmarksView = () => {
    const bookmarkedChapters = treatiseChapters.filter(ch => bookmarkedIds.includes(ch.id));

    if (bookmarkedChapters.length === 0) {
      return (
        <div className="text-center py-12" style={{ color: 'rgba(253,251,245,0.5)' }}>
          <div className="text-2xl mb-3">☆</div>
          <div className="text-[13px]">No bookmarked chapters yet</div>
          <div className="text-[11px] mt-1">Click the star on any chapter to bookmark it</div>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[450px] overflow-y-auto">
        {bookmarkedChapters.map(ch => (
          <button
            key={ch.id}
            onClick={() => openChapterModal(ch)}
            className="w-full text-left px-4 py-3 rounded-xl border transition-all group"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--accent-15)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-medium group-hover:text-white transition-colors" style={{ color: 'rgba(253,251,245,0.85)' }}>
                  {sanitizeText(ch.title)}
                </div>
                {ch.subtitle && <div className="text-[11px] mt-1" style={{ color: 'rgba(253,251,245,0.5)' }}>{sanitizeText(ch.subtitle)}</div>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleBookmark(ch.id); }}
                style={{ color: 'var(--accent-color)' }}
              >
                ★
              </button>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VIDEOS VIEW - Now uses VideoLibrary component
  // ─────────────────────────────────────────────────────────────────────────
  const renderVideosView = () => <VideoLibrary />;

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <ChapterModal
        chapter={modalChapter}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onBookmark={toggleBookmark}
        isBookmarked={modalChapter && bookmarkedIds.includes(modalChapter.id)}
        allChapters={treatiseChapters}
        onNavigate={(ch) => setModalChapter(ch)}
      />

      <div className="w-full max-w-5xl mx-auto">
        <div
          className="border border-[var(--accent-15)] backdrop-blur-xl px-7 pt-8 pb-9 space-y-5 relative overflow-hidden"
          style={{
            background: 'rgba(20, 10, 15, 0.78)',
            borderRadius: 'var(--radius-panel)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          {/* Wisdom scroll background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${import.meta.env.BASE_URL}wisdom - scroll.png)`,
              backgroundSize: 'contain',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.17,
              zIndex: 0,
              borderRadius: 'var(--radius-panel)',
            }}
          />
          {/* Wisdom Selector - Dropdown Style (matching practice menu) */}
          <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {/* Text prompt above button */}
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '11px',
                letterSpacing: '0.15em',
                color: 'rgba(253,251,245,0.5)',
                textTransform: 'uppercase',
              }}
            >
              What do you need?
            </div>
            <button
              onClick={() => setWisdomModalOpen(true)}
              className="px-6 py-3 rounded-full"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                border: '1px solid var(--accent-30)',
                boxShadow: '0 0 25px var(--accent-15), inset 0 0 20px var(--accent-08)',
                transform: wisdomModalOpen ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 300ms ease-out, background 300ms ease-out, box-shadow 300ms ease-out',
              }}
            >
              <span>{activeTab}{activeTab === "Bookmarks" && bookmarkedIds.length > 0 ? ` (${bookmarkedIds.length})` : ""}</span>
              {/* Chevron */}
              <span
                style={{
                  fontSize: '10px',
                  transform: wisdomModalOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease-out',
                }}
              >
                ▼
              </span>
            </button>
          </div>

          {/* Content */}
          <section className="min-h-[400px] relative z-10">
            {activeTab === "Recommendations" && renderRecommendationsView()}
            {activeTab === "Treatise" && renderTreatiseView()}
            {activeTab === "Bookmarks" && renderBookmarksView()}
            {activeTab === "Videos" && renderVideosView()}
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
    </>
  );
}