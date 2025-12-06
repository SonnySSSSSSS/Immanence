// src/data/treatiseParts.js
// Organizes treatise chapters into thematic parts

export const treatiseParts = [
    {
        id: 'part-1',
        number: 1,
        title: 'The Call',
        subtitle: 'The Invitation to Conscious Living',
        chapterRange: [1, 5],
    },
    {
        id: 'part-2',
        number: 2,
        title: 'The Architecture of Being',
        subtitle: 'The Mythology of the Inner World',
        chapterRange: [6, 10],
    },
    {
        id: 'part-3',
        number: 3,
        title: 'Shadow as Curriculum',
        subtitle: 'Integration Through Awareness',
        chapterRange: [11, 16],
    },
    {
        id: 'part-4',
        number: 4,
        title: 'The Hybrid Layer of Reality',
        subtitle: 'Where Inner Meets Outer',
        chapterRange: [17, 41],
    },
    {
        id: 'part-5',
        number: 5,
        title: 'The Practice',
        subtitle: 'Skillful Navigation',
        chapterRange: [42, 53],
    },
    {
        id: 'part-6',
        number: 6,
        title: 'Integration & Evolution',
        subtitle: 'Becoming What You Practice',
        chapterRange: [54, 58],
    },
    {
        id: 'appendices',
        number: null,
        title: 'Appendices',
        subtitle: 'Reference Materials',
        chapterRange: null, // Appendices use letter-based IDs
        isAppendix: true,
    },
];

/**
 * Get the part that contains a given chapter number
 */
export function getPartForChapter(chapterOrder) {
    if (typeof chapterOrder !== 'number') return null;

    for (const part of treatiseParts) {
        if (part.chapterRange) {
            const [start, end] = part.chapterRange;
            if (chapterOrder >= start && chapterOrder <= end) {
                return part;
            }
        }
    }
    return null;
}

/**
 * Get chapters that belong to a specific part
 */
export function getChaptersForPart(partId, allChapters) {
    const part = treatiseParts.find(p => p.id === partId);
    if (!part) return [];

    if (part.isAppendix) {
        // Appendices have string-based orders like 'A', 'B', etc.
        return allChapters.filter(ch => typeof ch.order === 'string');
    }

    if (part.chapterRange) {
        const [start, end] = part.chapterRange;
        return allChapters.filter(ch =>
            typeof ch.order === 'number' &&
            ch.order >= start &&
            ch.order <= end
        );
    }

    return [];
}
