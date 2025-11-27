// src/components/WisdomSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { treatiseChapters } from "../data/treatise.generated.js";

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

// We add a "Bookmarks" tab now
const TABS = ["Treatise", "Bookmarks", "Videos", "Blog"];

const BOOKMARKS_KEY = "immanenceOS.bookmarkedChapters";
const SCROLL_KEY = "immanenceOS.chapterScrollPositions";

export function WisdomSection() {
  const [activeTab, setActiveTab] = useState("Treatise");

  // search + selection state
  const [searchQuery, setSearchQuery] = useState("");

  // bookmarks: array of chapter ids
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // scroll positions: { [chapterId]: number }
  const [scrollPositions, setScrollPositions] = useState({});

  // chapter selection
  const [activeChapterId, setActiveChapterId] = useState(
    treatiseChapters[0]?.id ?? null
  );

  // full-screen reader mode
  const [focusMode, setFocusMode] = useState(false);

  // ref to the chapter detail scroll container
  const detailRef = useRef(null);

  // --- Load bookmarks & scroll positions from localStorage on mount ---
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

  // --- Persist bookmarks when they change ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarkedIds));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  // --- Persist scroll positions when they change ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SCROLL_KEY, JSON.stringify(scrollPositions));
    } catch {
      // ignore
    }
  }, [scrollPositions]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Base chapter set depends on tab: all vs bookmarks
  const baseChapters =
    activeTab === "Bookmarks"
      ? treatiseChapters.filter((ch) => bookmarkedIds.includes(ch.id))
      : treatiseChapters;

  // filter chapters by search over the base set
  const filteredChapters = normalizedQuery
    ? baseChapters.filter((ch) => {
        const title = (ch.title || "").toLowerCase();
        const body = (ch.body || "").toLowerCase();
        return (
          title.includes(normalizedQuery) || body.includes(normalizedQuery)
        );
      })
    : baseChapters;

  // current active chapter (fall back to first filtered)
  const activeChapter =
    filteredChapters.find((ch) => ch.id === activeChapterId) ||
    filteredChapters[0];

  // when active chapter changes, restore scroll position if any
  useEffect(() => {
    if (!detailRef.current || !activeChapter) return;
    const savedScroll = scrollPositions[activeChapter.id] ?? 0;
    detailRef.current.scrollTop = savedScroll;
  }, [activeChapter, scrollPositions]);

  // track scroll position for the current chapter
  const handleDetailScroll = () => {
    if (!detailRef.current || !activeChapter) return;
    const top = detailRef.current.scrollTop;
    setScrollPositions((prev) => ({
      ...prev,
      [activeChapter.id]: top,
    }));
  };

  // toggle bookmarks
  const toggleBookmark = () => {
    if (!activeChapter) return;
    setBookmarkedIds((prev) => {
      if (prev.includes(activeChapter.id)) {
        return prev.filter((id) => id !== activeChapter.id);
      }
      return [...prev, activeChapter.id];
    });
  };

  const isActiveBookmarked =
    !!activeChapter && bookmarkedIds.includes(activeChapter.id);

  // small helper to get a nice preview/summary line
  const getPreview = (body = "") => {
    const clean = body.replace(/\s+/g, " ").trim();
    if (!clean) return "";
    // naive "first sentence" approximation
    const firstStop = clean.indexOf(". ");
    const snippet =
      firstStop > 0 ? clean.slice(0, firstStop + 1) : clean.slice(0, 160);
    return snippet.length < clean.length ? snippet + "…" : snippet;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.24em] text-white/50 mb-2">
          Modes
        </div>
        <div className="inline-flex rounded-full bg-black/20 p-1 border border-white/10">
          {TABS.map((tab) => {
            const active = tab === activeTab;
            const isBookmarks = tab === "Bookmarks";
            const countLabel =
              isBookmarks && bookmarkedIds.length > 0
                ? ` (${bookmarkedIds.length})`
                : "";

            return (
              <button
                key={tab}
                className={
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-colors " +
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
        </div>
      </section>

      {/* Content panel */}
      <section className="relative flex-1 min-h-[260px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 px-4 py-4 flex flex-col gap-3 overflow-hidden">
        {/* Treatise + Bookmarks share the same layout */}
        {(activeTab === "Treatise" || activeTab === "Bookmarks") && (
          <div className="flex flex-col md:flex-row gap-3 h-full">
            {/* Left side: search + chapter list */}
            <div className="md:w-1/2 w-full flex flex-col max-h-64">
              {/* Search bar */}
              <div className="mb-2 flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
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
                {normalizedQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[10px] text-white/60 hover:text-white px-2 py-1 rounded-full border border-white/20"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Results meta */}
              <div className="text-[10px] text-white/50 mb-1">
                {baseChapters.length === 0 &&
                  (activeTab === "Bookmarks"
                    ? "No bookmarked chapters yet."
                    : "No chapters available.")}
                {baseChapters.length > 0 &&
                  (normalizedQuery
                    ? `${filteredChapters.length} result${
                        filteredChapters.length === 1 ? "" : "s"
                      } for “${searchQuery.trim()}”`
                    : activeTab === "Bookmarks"
                    ? `${bookmarkedIds.length} bookmarked chapter${
                        bookmarkedIds.length === 1 ? "" : "s"
                      }`
                    : `${treatiseChapters.length} chapters`)}
              </div>

              {/* Chapter list */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {filteredChapters.map((ch) => {
                  const selected = activeChapter && ch.id === activeChapter.id;
                  const preview = getPreview(ch.body || "");

                  return (
                    <button
                      key={ch.id}
                      className={
                        "w-full text-left rounded-2xl px-3 py-2 border text-xs transition-colors " +
                        (selected
                          ? "border-white/70 bg-white/10 text-white"
                          : "border-white/10 bg-white/0 text-white/80 hover:border-white/30 hover:bg-white/5")
                      }
                      onClick={() => setActiveChapterId(ch.id)}
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
                    <span className="italic">“{searchQuery.trim()}”</span>. Try
                    a different word or clear the filter.
                  </div>
                )}
              </div>
            </div>

            {/* Right side: active chapter detail */}
            <div className="md:w-1/2 w-full max-h-64 overflow-y-auto pl-1 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-3 text-[11px] leading-relaxed text-white/80 relative">
              {activeChapter ? (
                <>
                  {/* Header row: title + actions */}
                  <div className="flex items-start justify-between gap-2 mb-2 sticky top-0 bg-gradient-to-b from-bgEnd/80 to-bgEnd/0 pt-1 pb-2 z-10">
                    <div>
                      <div className="font-semibold mb-0.5">
                        {activeChapter.title}
                      </div>
                      {activeChapter.subtitle && (
                        <div className="text-white/60 text-[10px]">
                          {activeChapter.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Bookmark toggle */}
                      <button
                        onClick={toggleBookmark}
                        className={
                          "text-[11px] px-2 py-1 rounded-full border transition-colors " +
                          (isActiveBookmarked
                            ? "border-amber-300 bg-amber-300/10 text-amber-200"
                            : "border-white/25 bg-black/20 text-white/70 hover:text-white hover:border-white/50")
                        }
                        title={
                          isActiveBookmarked
                            ? "Remove bookmark"
                            : "Bookmark this chapter"
                        }
                      >
                        {isActiveBookmarked ? "★ Saved" : "☆ Save"}
                      </button>

                      {/* Focus mode toggle */}
                      <button
                        onClick={() => setFocusMode(true)}
                        className="text-[11px] px-2 py-1 rounded-full border border-white/25 bg-black/20 text-white/70 hover:text-white hover:border-white/50"
                        title="Enter focus mode"
                      >
                        Focus
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div
                    ref={detailRef}
                    onScroll={handleDetailScroll}
                    className="max-h-[200px] md:max-h-[260px] overflow-y-auto pr-1 pb-2"
                  >
                    <p className="whitespace-pre-line">
                      {(activeChapter.body || "").trim()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-white/50">
                  {activeTab === "Bookmarks"
                    ? "No bookmarked chapters yet. Add one from the Treatise tab."
                    : "Select a chapter from the list to read it here."}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Videos" && (
          <div className="flex flex-col gap-2 text-xs">
            {mockVideos.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2 bg-white/0 hover:bg-white/5 transition-colors"
              >
                <div>
                  <div className="font-semibold text-white/90">{v.title}</div>
                  <div className="text-[10px] text-white/60">
                    Prototype · {v.length}
                  </div>
                </div>
                <button className="text-[11px] px-3 py-1 rounded-full border border-white/30 text-white/90">
                  Open
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Blog" && (
          <div className="flex flex-col gap-2 text-xs">
            {mockBlog.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-white/10 px-3 py-2 bg-white/0 hover:bg-white/5 transition-colors"
              >
                <div className="font-semibold text-white/90">
                  {post.title}
                </div>
                <div className="text-[10px] text-white/60 mt-1">
                  {post.preview}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full-screen focus reader overlay */}
        {focusMode && activeChapter && (
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-bgEnd via-black/90 to-bgEnd/90 px-4 py-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                Focus · Treatise
              </div>
              <button
                onClick={() => setFocusMode(false)}
                className="text-[11px] px-3 py-1 rounded-full border border-white/40 text-white/80 hover:text-white hover:border-white"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-[12px] leading-relaxed text-white/85">
              <div className="mb-2">
                <div className="text-sm font-semibold mb-1">
                  {activeChapter.title}
                </div>
                {activeChapter.subtitle && (
                  <div className="text-white/60 text-[11px] mb-2">
                    {activeChapter.subtitle}
                  </div>
                )}
              </div>
              <p className="whitespace-pre-line">
                {(activeChapter.body || "").trim()}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
