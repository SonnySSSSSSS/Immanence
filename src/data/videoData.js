// src/data/videoData.js
// Video catalog with provider abstraction for future migration

/**
 * Video categories matching app domains
 */
export const VIDEO_CATEGORIES = [
    { id: 'foundation', label: 'Foundation', icon: '🌱', description: 'Start here' },
    { id: 'breathwork', label: 'Breathwork', icon: '🫁', description: 'Breathing techniques' },
    { id: 'visualization', label: 'Visualization', icon: '👁️', description: 'Visual practices' },
    { id: 'wisdom', label: 'Wisdom', icon: '📖', description: 'Teachings & philosophy' },
    { id: 'practice', label: 'Practice Guides', icon: '🧘', description: 'How-to sessions' }
];

/**
 * Video catalog
 * 
 * Structure:
 * - id: unique identifier
 * - provider: 'youtube' | 'vimeo' | 'cloudflare' | 'self'
 * - externalId: provider-specific video ID
 * - title: display title
 * - category: one of VIDEO_CATEGORIES.id
 * - duration: human-readable (e.g., "5:30")
 * - durationSec: total seconds (for calculations)
 * - description: short description
 * - order: sequence within category
 * - tags: searchable keywords
 * - isFeatured: show in featured section
 * - pathId: link to specific path (optional)
 * - week: link to specific week (optional)
 * - embedOptions: provider-specific options
 */
export const VIDEOS = [
    // ═══════════════════════════════════════════════════════════════════════════
    // FOUNDATION
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'foundation-welcome',
        provider: 'youtube',
        externalId: 'PLACEHOLDER_ID_1', // Replace with real YouTube ID
        title: 'Welcome to Immanence',
        category: 'foundation',
        duration: '8:00',
        durationSec: 480,
        description: 'An introduction to the practice system and what to expect on your journey.',
        order: 1,
        tags: ['intro', 'beginner', 'overview'],
        isFeatured: true,
        pathId: null,
        week: null,
        embedOptions: {}
    },
    {
        id: 'foundation-how-to-practice',
        provider: 'youtube',
        externalId: 'PLACEHOLDER_ID_2',
        title: 'How to Practice',
        category: 'foundation',
        duration: '12:00',
        durationSec: 720,
        description: 'Learn the basics of setting up your practice space and building a daily routine.',
        order: 2,
        tags: ['beginner', 'routine', 'setup'],
        isFeatured: true,
        pathId: null,
        week: null,
        embedOptions: {}
    },
    {
        id: 'foundation-the-path-system',
        provider: 'youtube',
        externalId: 'PLACEHOLDER_ID_3',
        title: 'Understanding the Paths',
        category: 'foundation',
        duration: '10:00',
        durationSec: 600,
        description: 'An overview of the six paths and how to choose the right one for you.',
        order: 3,
        tags: ['paths', 'beginner', 'overview'],
        isFeatured: false,
        pathId: null,
        week: null,
        embedOptions: {}
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // BREATHWORK
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'breathwork-box-breathing',
        provider: 'youtube',
        externalId: 'PLACEHOLDER_ID_4',
        title: 'Box Breathing Explained',
        category: 'breathwork',
        duration: '6:00',
        durationSec: 360,
        description: 'Master the 4-4-4-4 box breathing pattern for calm and focus.',
        order: 1,
        tags: ['box', 'beginner', 'calm', 'focus'],
        isFeatured: true,
        pathId: 'prana',
        week: 1,
        embedOptions: {}
    },
    {
        id: 'breathwork-478',
        provider: 'youtube',
        externalId: 'PLACEHOLDER_ID_5',
        title: '4-7-8 Relaxation Breath',
        category: 'breathwork',
        duration: '7:00',
        durationSec: 420,
        description: 'The classic relaxation pattern for sleep and stress relief.',
        order: 2,
        tags: ['relaxation', 'sleep', 'stress'],
        isFeatured: false,
        pathId: 'prana',
        week: 2,
        embedOptions: {}
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // VISUALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'visualization-sacred-geometry',
        provider: 'youtube',
        externalId: 'PLACEHOLDER_ID_6',
        title: 'Introduction to Sacred Geometry',
        category: 'visualization',
        duration: '15:00',
        durationSec: 900,
        description: 'Understanding the patterns that underlie reality and consciousness.',
        order: 1,
        tags: ['geometry', 'beginner', 'theory'],
        isFeatured: true,
        pathId: 'drishti',
        week: 1,
        embedOptions: {}
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all videos in a category, sorted by order
 */
export function getVideosByCategory(categoryId) {
    return VIDEOS
        .filter(v => v.category === categoryId)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get featured videos
 */
export function getFeaturedVideos() {
    return VIDEOS.filter(v => v.isFeatured);
}

/**
 * Get videos for a specific path/week
 */
export function getVideosForPath(pathId, week = null) {
    return VIDEOS.filter(v =>
        v.pathId === pathId && (week === null || v.week === week)
    );
}

/**
 * Search videos by title or tags
 */
export function searchVideos(query) {
    const q = query.toLowerCase().trim();
    if (!q) return VIDEOS;

    return VIDEOS.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q)) ||
        v.description.toLowerCase().includes(q)
    );
}

/**
 * Get a single video by ID
 */
export function getVideoById(id) {
    return VIDEOS.find(v => v.id === id) || null;
}

/**
 * Get embed URL for a video based on provider
 */
export function getEmbedUrl(video, options = {}) {
    const { autoplay = false, start = 0 } = options;

    switch (video.provider) {
        case 'youtube': {
            const params = new URLSearchParams({
                modestbranding: '1',
                rel: '0',
                enablejsapi: '1',  // Required for IFrame API
                origin: window.location.origin
            });
            if (autoplay) params.set('autoplay', '1');
            if (start > 0) params.set('start', String(Math.floor(start)));
            return `https://www.youtube.com/embed/${video.externalId}?${params}`;
        }

        case 'vimeo': {
            const params = new URLSearchParams({
                title: '0',
                byline: '0',
                portrait: '0'
            });
            if (autoplay) params.set('autoplay', '1');
            return `https://player.vimeo.com/video/${video.externalId}?${params}`;
        }

        case 'cloudflare':
            return `https://iframe.cloudflarestream.com/${video.externalId}`;

        case 'self':
            return video.externalId; // Direct URL

        default:
            console.warn(`Unknown video provider: ${video.provider}`);
            return null;
    }
}
