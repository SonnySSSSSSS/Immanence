export const WISDOM_TABS = [
    'Treatise',
    'Bookmarks',
    'Videos',
    'Self-Knowledge',
];

export const WISDOM_TAB_ICONS = {
    Treatise: 'treatise',
    Bookmarks: 'bookmarks',
    Videos: 'videos',
    'Self-Knowledge': 'selfknowledge',
};

export const WISDOM_TAB_LABELS = {
    Treatise: 'Treatise',
    Bookmarks: 'Bookmarks',
    Videos: 'Videos',
    'Self-Knowledge': 'Self',
};

export function getBookmarkedIds(bookmarks = []) {
    return Array.isArray(bookmarks)
        ? bookmarks.map((bookmark) => bookmark.sectionId)
        : [];
}

export function getBookmarkedChapters(chapters = [], bookmarkedIds = []) {
    const bookmarkedSet = new Set(Array.isArray(bookmarkedIds) ? bookmarkedIds : []);
    return Array.isArray(chapters)
        ? chapters.filter((chapter) => bookmarkedSet.has(chapter.id))
        : [];
}

export function filterTreatiseChapters(chapters = [], searchQuery = '') {
    const normalizedQuery = typeof searchQuery === 'string'
        ? searchQuery.trim().toLowerCase()
        : '';

    if (!normalizedQuery) {
        return {
            normalizedQuery,
            filteredChapters: null,
        };
    }

    const filteredChapters = Array.isArray(chapters)
        ? chapters.filter((chapter) => {
            const searchText = [
                chapter?.title ?? '',
                chapter?.subtitle ?? '',
                chapter?.excerpt ?? '',
            ].join(' ').toLowerCase();

            return searchText.includes(normalizedQuery);
        })
        : [];

    return {
        normalizedQuery,
        filteredChapters,
    };
}

export function getWisdomTabDisplayLabel(tab, bookmarkedCount = 0) {
    if (tab === 'Bookmarks' && bookmarkedCount > 0) {
        return `${WISDOM_TAB_LABELS[tab]} (${bookmarkedCount})`;
    }

    return WISDOM_TAB_LABELS[tab];
}

export function getWisdomTabTutorialAnchor(tab) {
    if (tab === 'Treatise') return 'wisdom-tab-treatise';
    if (tab === 'Bookmarks') return 'wisdom-tab-bookmarks';
    if (tab === 'Videos') return 'wisdom-tab-videos';
    if (tab === 'Self-Knowledge') return 'wisdom-tab-self-knowledge';
    return null;
}

export function resolveActiveWisdomView(activeTab) {
    return WISDOM_TABS.includes(activeTab) ? activeTab : null;
}

export function getChapterById(chapters = [], chapterId) {
    if (!chapterId || !Array.isArray(chapters)) return null;
    return chapters.find((chapter) => chapter.id === chapterId) ?? null;
}

export function resolveWisdomContentLaunch(contentLaunchContext, chapters = []) {
    if (!contentLaunchContext || typeof contentLaunchContext !== 'object') {
        return null;
    }

    const durationMin = typeof contentLaunchContext.durationMin === 'number'
        ? contentLaunchContext.durationMin
        : null;

    if (contentLaunchContext.target === 'chapter' && contentLaunchContext.chapterId) {
        const chapter = getChapterById(chapters, contentLaunchContext.chapterId);
        if (!chapter) return null;

        return {
            type: 'chapter',
            activeTab: 'Treatise',
            chapter,
            durationMin,
        };
    }

    if (contentLaunchContext.target === 'video' && contentLaunchContext.videoId) {
        return {
            type: 'video',
            activeTab: 'Videos',
            videoId: contentLaunchContext.videoId,
            durationMin,
        };
    }

    return null;
}
