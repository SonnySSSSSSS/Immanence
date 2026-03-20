// src/components/wisdom/PartAccordion.jsx
// Extracted from WisdomSection.jsx — collapsible part accordion for the Treatise tab
import { sanitizeText } from "../../utils/textUtils.js";

export function PartAccordion({
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
                    data-tutorial="wisdom-treatise-bookmark-star"
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
