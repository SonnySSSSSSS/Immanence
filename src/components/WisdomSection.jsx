// src/components/WisdomSection.jsx
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { treatiseChapters } from "../data/treatise.generated.js";
import { wisdomCategories, getAllCategories } from "../data/wisdomRecommendations.js";
import { sanitizeText } from "../utils/textUtils.js";
import { Avatar } from "./Avatar.jsx";

const mockVideos = [
  {
    id: "ancestors-ddos",
    title: "Ancestors as DDoS Protection",
    length: "12:34",
  },
  {
    id: "xom-reality-sync",
    title: "Xóm Culture as Reality Sync",
    length: "09:18",
  },
];

const mockBlog = [
  {
    id: "glitched-horizon",
    title: "The Glitched Horizon Aesthetic",
    preview:
      "What happens when spiritual clarity borrows its visual language from cyberpunk and soft apocalypses...",
  },
];

const TABS = ["Recommendations", "Treatise", "Bookmarks", "Videos"];
const BOOKMARKS_KEY = "immanenceOS.bookmarkedChapters";
const SCROLL_KEY = "immanenceOS.chapterScrollPositions";

// Modal Component for reading full chapter text - Illuminated Manuscript Aesthetic
function ChapterModal({ chapter, isOpen, onClose, onBookmark, isBookmarked }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef(null);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !chapter) return null;

  // Sanitize chapter content
  const sanitizedTitle = sanitizeText(chapter.title || '');
  const sanitizedSubtitle = sanitizeText(chapter.subtitle || '');
  const sanitizedExcerpt = sanitizeText(chapter.excerpt || '');
  const sanitizedBody = sanitizeText(chapter.body || '');

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        animation: 'fadeIn 300ms ease-out'
      }}
    >
      <div
        className="bg-[#0a0a12] border border-[rgba(253,224,71,0.2)] rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        style={{
          animation: 'scaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Reading Progress Indicator - made slightly more prominent */}
        <div
          className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-[#fcd34d] to-[#f59e0b] transition-all duration-150 z-10"
          style={{
            width: `${scrollProgress}%`,
            boxShadow: '0 0 12px rgba(253, 224, 71, 0.5)'
          }}
        />

        {/* Header */}
        <div className="border-b border-[rgba(253,224,71,0.15)] px-8 py-6 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex-1">
            <h2
              className="text-2xl font-semibold text-[#fcd34d] mb-2"
              style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.02em' }}
            >
              {sanitizedTitle}
            </h2>
            {sanitizedSubtitle && (
              <p
                className="text-sm text-[rgba(253,251,245,0.7)] italic"
                style={{ fontFamily: 'Crimson Pro, serif' }}
              >
                {sanitizedSubtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onBookmark(chapter.id)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-all ${isBookmarked
                ? "bg-gradient-to-br from-[#fcd34d] to-[#f59e0b] border-transparent text-[#050508] font-semibold shadow-[0_0_12px_rgba(253,224,71,0.3)]"
                : "border-[rgba(253,224,71,0.3)] text-[rgba(253,224,71,0.7)] hover:border-[rgba(253,224,71,0.5)] hover:bg-[rgba(253,224,71,0.05)]"
                }`}
            >
              {isBookmarked ? "★" : "☆"}
            </button>
            <button
              onClick={onClose}
              className="text-[rgba(253,251,245,0.5)] hover:text-[rgba(253,251,245,0.9)] text-xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-[rgba(253,224,71,0.1)] transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Ornamental Divider */}
        <div className="flex items-center justify-center py-4 border-b border-[rgba(253,224,71,0.1)]">
          <div className="flex items-center gap-4 text-[rgba(253,224,71,0.3)]">
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-[rgba(253,224,71,0.3)]" />
            <div style={{ fontSize: '10px' }}>◆</div>
            <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-[rgba(253,224,71,0.3)]" />
          </div>
        </div>

        {/* Content with markdown rendering */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-12 py-8 prose-content"
          style={{
            fontFamily: 'Crimson Pro, serif',
            fontSize: '17px',
            lineHeight: '1.75',
            color: 'rgba(253,251,245,0.92)',
            maxWidth: '65ch',
            margin: '0 auto',
            width: '100%'
          }}
        >
          {sanitizedExcerpt && (
            <blockquote
              className="border-l-2 pl-6 pr-4 py-4 my-6 markdown-content"
              style={{
                borderColor: 'rgba(253,224,71,0.4)',
                backgroundColor: 'rgba(253,224,71,0.03)',
                boxShadow: '-2px 0 8px rgba(253,224,71,0.1)',
                borderRadius: '0 8px 8px 0'
              }}
            >
              <ReactMarkdown>
                {sanitizedExcerpt}
              </ReactMarkdown>
            </blockquote>
          )}
          {sanitizedBody ? (
            <div className="markdown-content">
              <ReactMarkdown>
                {sanitizedBody}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-[rgba(253,251,245,0.4)] text-center py-12">No content available.</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[rgba(253,224,71,0.15)] px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="text-[9px] text-[rgba(253,251,245,0.4)]" style={{ fontFamily: 'Crimson Pro, serif' }}>
            Press <span className="font-mono px-1.5 py-0.5 rounded bg-[rgba(253,224,71,0.1)] text-[rgba(253,251,245,0.5)]">Esc</span> to close
          </div>
          <div className="text-xs text-[rgba(253,251,245,0.5)]" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>Chapter {chapter.order}</div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .markdown-content {
          font-family: 'Crimson Pro', serif;
          color: rgba(253, 251, 245, 0.92);
          line-height: 1.75;
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          font-family: 'Cinzel', serif;
          color: #fcd34d;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin-top: 2.5em;
          margin-bottom: 1em;
        }

        .markdown-content h1 {
          font-size: 2em;
          line-height: 1.2;
        }

        .markdown-content h2 {
          font-size: 1.65em;
          line-height: 1.3;
          border-bottom: 1px solid rgba(253, 224, 71, 0.15);
          padding-bottom: 0.5em;
        }

        .markdown-content h3 {
          font-size: 1.35em;
          line-height: 1.4;
        }

        .markdown-content h4 {
          font-size: 1.15em;
        }

        .markdown-content h5,
        .markdown-content h6 {
          font-size: 1em;
        }

        .markdown-content p {
          margin-top: 1em;
          margin-bottom: 1em;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin-top: 1em;
          margin-bottom: 1em;
          margin-left: 1.75em;
          color: rgba(253, 251, 245, 0.92);
        }

        .markdown-content li {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }

        .markdown-content blockquote {
          border-left: 2px solid rgba(253, 224, 71, 0.4);
          background-color: rgba(253, 224, 71, 0.03);
          box-shadow: -2px 0 8px rgba(253, 224, 71, 0.1);
          padding-left: 1.5em;
          padding-right: 1em;
          padding-top: 1em;
          padding-bottom: 1em;
          margin-left: 0;
          margin-right: 0;
          margin-top: 1.5em;
          margin-bottom: 1.5em;
          color: rgba(253, 251, 245, 0.85);
          font-style: italic;
          border-radius: 0 8px 8px 0;
        }

        .markdown-content code {
          background-color: rgba(253, 224, 71, 0.08);
          color: rgba(253, 224, 71, 0.9);
          padding: 0.2em 0.5em;
          border-radius: 4px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.9em;
        }

        .markdown-content pre {
          background-color: rgba(0, 0, 0, 0.4);
          color: rgba(253, 251, 245, 0.92);
          padding: 1.25em;
          border-radius: 8px;
          overflow-x: auto;
          margin-top: 1.5em;
          margin-bottom: 1.5em;
          border: 1px solid rgba(253, 224, 71, 0.15);
        }

        .markdown-content pre code {
          background: none;
          color: inherit;
          padding: 0;
          border-radius: 0;
        }

        .markdown-content hr {
          border: none;
          margin: 3em 0;
          text-align: center;
        }

        .markdown-content hr::after {
          content: '◆';
          color: rgba(253, 224, 71, 0.3);
          font-size: 12px;
        }

        .markdown-content a {
          color: rgba(253, 224, 71, 0.8);
          text-decoration: underline;
          text-decoration-color: rgba(253, 224, 71, 0.3);
          transition: all 0.2s;
        }

        .markdown-content a:hover {
          color: #fcd34d;
          text-decoration-color: rgba(253, 224, 71, 0.6);
        }

        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1.5em;
          margin-bottom: 1.5em;
        }

        .markdown-content th,
        .markdown-content td {
          border: 1px solid rgba(253, 224, 71, 0.15);
          padding: 0.75em;
          text-align: left;
        }

        .markdown-content th {
          background-color: rgba(253, 224, 71, 0.08);
          color: rgba(253, 224, 71, 0.9);
          font-weight: 600;
          font-family: 'Cinzel', serif;
        }

        /* Custom scrollbar */
        .prose-content::-webkit-scrollbar {
          width: 8px;
        }

        .prose-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .prose-content::-webkit-scrollbar-thumb {
          background: rgba(253, 224, 71, 0.2);
          border-radius: 4px;
        }

        .prose-content::-webkit-scrollbar-thumb:hover {
          background: rgba(253, 224, 71, 0.3);
        }
      `}</style>
    </div>
  );
}

export function WisdomSection() {
  const [activeTab, setActiveTab] = useState("Recommendations");
  const [selectedCategory, setSelectedCategory] = useState("focus-presence");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [scrollPositions, setScrollPositions] = useState({});
  const [activeChapterId, setActiveChapterId] = useState(
    treatiseChapters[0]?.id ?? null
  );
  const [focusMode, setFocusMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalChapter, setModalChapter] = useState(null);
  const detailRef = useRef(null);

  // Load bookmarks & scroll positions from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedBookmarks = window.localStorage.getItem(BOOKMARKS_KEY);
      if (storedBookmarks) {
        setBookmarkedIds(JSON.parse(storedBookmarks));
      }
    } catch {
      // ignore
    }
    try {
      const storedScroll = window.localStorage.getItem(SCROLL_KEY);
      if (storedScroll) {
        setScrollPositions(JSON.parse(storedScroll));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist bookmarks
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarkedIds));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  // Persist scroll positions
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SCROLL_KEY, JSON.stringify(scrollPositions));
    } catch {
      // ignore
    }
  }, [scrollPositions]);

  // Helper functions
  const getChapterById = (id) => treatiseChapters.find((ch) => ch.id === id);
  const activeChapter = getChapterById(activeChapterId);

  const getPreview = (text) => {
    const stripped = text.replace(/[#*_`\[\]]/g, "");
    return stripped.slice(0, 150).trim() + (stripped.length > 150 ? "..." : "");
  };

  const toggleBookmark = (chapterId) => {
    setBookmarkedIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const openChapterModal = (chapter) => {
    setModalChapter(chapter);
    setModalOpen(true);
  };

  // Recommendations view
  const renderRecommendationsView = () => {
    const categories = getAllCategories();
    const currentCategory = wisdomCategories[selectedCategory];

    return (
      <div className="w-full flex flex-col gap-4">
        {/* Category selector */}
        <div className="flex flex-col gap-2">
          <div className="text-[9px] uppercase tracking-[0.24em] text-[rgba(253,251,245,0.5)]">
            Select Your Focus
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-2 rounded-full text-[10px] border transition-all ${selectedCategory === cat.key
                  ? "bg-gradient-to-br from-[#fcd34d] to-[#f59e0b] text-[#050508] font-semibold border-transparent shadow-[0_0_12px_rgba(253,224,71,0.25)]"
                  : "border-[rgba(253,224,71,0.2)] text-[rgba(253,251,245,0.65)] hover:border-[rgba(253,224,71,0.35)] hover:bg-[rgba(253,224,71,0.05)]"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category description */}
        {currentCategory && (
          <div className="border-t border-[rgba(253,224,71,0.15)] pt-4">
            <div
              className="text-[15px] text-[rgba(253,251,245,0.75)] mb-4 italic leading-relaxed"
              style={{ fontFamily: 'Crimson Pro, serif', lineHeight: '1.6' }}
            >
              {currentCategory.description}
            </div>

            {/* Recommended chapters */}
            <div className="space-y-3">
              {currentCategory.chapters.map((rec, idx) => {
                const chapter = getChapterById(rec.chapterRef);
                const isBookmarked =
                  chapter && bookmarkedIds.includes(chapter.id);

                return (
                  <div
                    key={idx}
                    className="border border-[rgba(253,224,71,0.1)] rounded-2xl px-4 py-3 bg-[rgba(253,251,245,0.02)] hover:border-[rgba(253,224,71,0.25)] hover:shadow-[0_0_20px_rgba(253,224,71,0.1)] transition-all cursor-pointer group"
                    style={{ borderLeft: '3px solid rgba(253, 224, 71, 0.3)' }}
                    onClick={() => {
                      if (chapter) {
                        openChapterModal(chapter);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div
                          className="text-[14px] font-semibold text-[rgba(253,251,245,0.92)] group-hover:text-[rgba(253,251,245,1)]"
                          style={{ fontFamily: 'Crimson Pro, serif' }}
                        >
                          {sanitizeText(rec.title)}
                        </div>
                      </div>
                      {chapter && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(chapter.id);
                          }}
                          className={`text-sm px-2 py-1 rounded-full transition-all flex-shrink-0 ${isBookmarked
                            ? "text-[#fcd34d]"
                            : "text-[#8b6914] hover:text-[#fcd34d]"
                            }`}
                          title={isBookmarked ? "Remove bookmark" : "Bookmark chapter"}
                        >
                          {isBookmarked ? "★" : "☆"}
                        </button>
                      )}
                    </div>
                    <div className="text-[12px] text-[rgba(253,251,245,0.65)] leading-relaxed">
                      <span className="text-[rgba(253,224,71,0.5)]">Why: </span>
                      {sanitizeText(rec.reasoning)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Treatise/Bookmarks view
  const renderTreatiseView = () => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const baseChapters =
      activeTab === "Bookmarks"
        ? treatiseChapters.filter((ch) => bookmarkedIds.includes(ch.id))
        : treatiseChapters;

    const filteredChapters = normalizedQuery
      ? baseChapters.filter((ch) => {
        const searchText =
          (ch.title + " " + (ch.subtitle || "") + " " + (ch.excerpt || ""))
            .toLowerCase();
        return searchText.includes(normalizedQuery);
      })
      : baseChapters;

    return (
      <div className="flex flex-col md:flex-row gap-3 h-full">
        {/* Left: Search + Chapter List */}
        <div className="md:w-1/2 w-full flex flex-col max-h-64">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "Bookmarks"
                    ? "Search bookmarked chapters..."
                    : "Search treatise..."
                }
                className="w-full bg-black/30 border border-white/15 rounded-full px-3 py-1.5 text-[11px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/50"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/40">
                ⌕
              </span>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[10px] text-white/60 hover:text-white px-2 py-1 rounded-full border border-white/20"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-[10px] text-white/50 mb-1">
            {baseChapters.length === 0 &&
              (activeTab === "Bookmarks"
                ? "No bookmarked chapters yet."
                : "No chapters available.")}
            {baseChapters.length > 0 &&
              (normalizedQuery
                ? `${filteredChapters.length} result${filteredChapters.length === 1 ? "" : "s"
                } for "${searchQuery.trim()}"`
                : activeTab === "Bookmarks"
                  ? `${bookmarkedIds.length} bookmarked chapter${bookmarkedIds.length === 1 ? "" : "s"
                  }`
                  : `${treatiseChapters.length} chapters`)}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {filteredChapters.map((ch) => {
              const preview = getPreview(ch.body || "");

              return (
                <button
                  key={ch.id}
                  className="w-full text-left rounded-2xl px-3 py-2 border border-white/10 bg-white/0 text-white/80 hover:border-white/30 hover:bg-white/5 transition-colors"
                  onClick={() => openChapterModal(ch)}
                >
                  <div className="text-[11px] font-semibold mb-1">
                    {ch.title}
                  </div>
                  {ch.subtitle && (
                    <div className="text-[10px] text-white/60 mb-1">
                      {ch.subtitle}
                    </div>
                  )}
                  {preview && (
                    <div className="mt-1 text-[10px] text-white/50 line-clamp-2">
                      {preview}
                    </div>
                  )}
                </button>
              );
            })}

            {filteredChapters.length === 0 && baseChapters.length > 0 && (
              <div className="text-[11px] text-white/50 py-4">
                No chapters match{" "}
                <span className="italic">"{searchQuery.trim()}"</span>.
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick info */}
        <div className="md:w-1/2 w-full pl-1 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-3 text-[11px] text-white/60">
          <div className="text-center text-[10px] text-white/50 py-8">
            Click a chapter to read full text in modal
          </div>
        </div>
      </div>
    );
  };

  // Render Videos
  const renderVideos = () => (
    <div className="space-y-3">
      {mockVideos.map((video) => (
        <div key={video.id} className="border border-white/10 rounded-2xl px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-white">
                {video.title}
              </div>
              <div className="text-[10px] text-white/60 mt-1">
                {video.length}
              </div>
            </div>
            <button className="text-[10px] px-3 py-1 rounded-full border border-white/30 text-white/70 hover:border-white/50 hover:bg-white/5 transition-colors">
              Play
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Render Blog
  const renderBlog = () => (
    <div className="space-y-3">
      {mockBlog.map((post) => (
        <div key={post.id} className="border border-white/10 rounded-2xl px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors">
          <div className="text-[11px] font-semibold text-white mb-2">
            {post.title}
          </div>
          <div className="text-[10px] text-white/60 mb-3">{post.preview}</div>
          <button className="text-[10px] px-3 py-1 rounded-full border border-white/30 text-white/70 hover:border-white/50 hover:bg-white/5 transition-colors">
            Read
          </button>
        </div>
      ))}
    </div>
  );

  // Main render
  return (
    <>
      <ChapterModal
        chapter={modalChapter}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onBookmark={toggleBookmark}
        isBookmarked={modalChapter && bookmarkedIds.includes(modalChapter.id)}
      />

      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-black/40 backdrop-blur-xl px-4 py-4 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          {/* Tabs */}
          <section className="flex gap-1 rounded-full bg-white/5 p-1 border border-white/10">
            {TABS.map((tab) => {
              const active = activeTab === tab;
              const countLabel =
                tab === "Bookmarks"
                  ? bookmarkedIds.length > 0
                    ? ` (${bookmarkedIds.length})`
                    : ""
                  : "";

              return (
                <button
                  key={tab}
                  className={
                    "px-5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap " +
                    (active
                      ? "bg-white text-bgEnd shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
                      : "text-white/70 hover:text-white")
                  }
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {countLabel}
                </button>
              );
            })}
          </section>

          {/* Content */}
          <section className="relative min-h-[300px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 px-4 py-4 flex flex-col overflow-hidden">
            {activeTab === "Recommendations" && renderRecommendationsView()}
            {(activeTab === "Treatise" || activeTab === "Bookmarks") &&
              renderTreatiseView()}
            {activeTab === "Videos" && renderVideos()}
            {activeTab === "Blog" && renderBlog()}
          </section>
        </div>
      </div>
    </>
  );
}