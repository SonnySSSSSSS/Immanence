// src/components/VideoLibrary.jsx
// Browse and search video library with category filtering

import React, { useState, useMemo } from 'react';
import { useVideoStore } from '../state/videoStore.js';
import {
    VIDEOS,
    VIDEO_CATEGORIES,
    getVideosByCategory,
    getFeaturedVideos,
    searchVideos
} from '../data/videoData.js';
import { VideoPlayerModal } from './VideoPlayer.jsx';

/**
 * VideoCard - Individual video card with watch status (wisdom-themed)
 */
function VideoCard({ video, onClick }) {
    const { getVideoState } = useVideoStore();
    const state = getVideoState(video.id);

    const thumbnailUrl = video.provider === 'youtube'
        ? `https://img.youtube.com/vi/${video.externalId}/mqdefault.jpg`
        : null;

    return (
        <button
            onClick={() => onClick(video)}
            className="w-full text-left group transition-all duration-200"
            style={{
                transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Thumbnail Container - Wisdom styled */}
            <div
                className="relative aspect-video rounded-[14px] overflow-hidden mb-2"
                style={{
                    background: 'radial-gradient(circle at 20% 0%, rgba(255,186,120,0.22), transparent 55%), linear-gradient(180deg, rgba(20,15,18,0.95), rgba(10,8,10,0.98))',
                    boxShadow: 'inset 0 0 0 2px rgba(243, 210, 130, 0.5)',
                }}
            >
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-[var(--gold-80)]">
                        🎬
                    </div>
                )}

                {/* Play overlay on hover - Gold themed */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                            background: 'rgba(237, 195, 101, 0.9)',
                            boxShadow: '0 0 20px rgba(255,200,100,0.6)',
                        }}
                    >
                        <span className="text-[#050508] ml-1 text-lg">▶</span>
                    </div>
                </div>

                {/* Duration badge - Gold gradient */}
                <div
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                        background: 'linear-gradient(135deg, var(--gold-80) 0%, var(--gold-60) 100%)',
                        color: '#050508',
                    }}
                >
                    {video.duration}
                </div>

                {/* Watch status badge */}
                {state.completed && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-[10px]">✓</span>
                    </div>
                )}
                {!state.completed && state.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                        <div
                            className="h-full"
                            style={{
                                width: `${state.progress * 100}%`,
                                background: 'linear-gradient(90deg, var(--gold-60), var(--gold-80))',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Title and description */}
            <h4 className="text-[12px] font-medium text-white group-hover:text-[var(--gold-80)] transition-colors line-clamp-2 mb-1">
                {video.title}
            </h4>
            <p className="text-[10px] text-[rgba(253,251,245,0.5)] line-clamp-2">
                {video.description}
            </p>
        </button>
    );
}


/**
 * VideoLibrary - Full browse/search interface
 */
export function VideoLibrary() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const { getWatchStats } = useVideoStore();

    const stats = getWatchStats();

    // Filter videos based on category and search
    const filteredVideos = useMemo(() => {
        let videos = searchQuery ? searchVideos(searchQuery) : VIDEOS;

        if (selectedCategory !== 'all') {
            videos = videos.filter(v => v.category === selectedCategory);
        }

        // Sort: in-progress first, then by order
        return videos.sort((a, b) => a.order - b.order);
    }, [selectedCategory, searchQuery]);

    const featuredVideos = useMemo(() => getFeaturedVideos(), []);

    return (
        <div className="w-full">
            {/* Header with stats */}
            <div className="flex items-center justify-between mb-4">
                <h2
                    className="text-sm font-medium text-white"
                    style={{ fontFamily: 'Georgia, serif' }}
                >
                    Video Library
                </h2>
                <div className="text-[9px] text-[rgba(253,251,245,0.5)]">
                    {stats.completed}/{VIDEOS.length} completed
                </div>
            </div>

            {/* Search bar */}
            <div className="relative mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search videos..."
                    className="wisdom-search w-full px-3 py-2 pl-8 text-white text-[11px] placeholder:text-[rgba(253,251,245,0.3)]"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gold-60)] text-sm">
                    🔍
                </span>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-all ${selectedCategory === 'all'
                        ? 'bg-[var(--accent-color)] text-black font-medium'
                        : 'bg-[rgba(253,251,245,0.08)] text-[rgba(253,251,245,0.7)] hover:bg-[rgba(253,251,245,0.12)]'
                        }`}
                >
                    All ({VIDEOS.length})
                </button>
                {VIDEO_CATEGORIES.map(cat => {
                    const count = VIDEOS.filter(v => v.category === cat.id).length;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-all ${selectedCategory === cat.id
                                ? 'bg-[var(--accent-color)] text-black font-medium'
                                : 'bg-[rgba(253,251,245,0.08)] text-[rgba(253,251,245,0.7)] hover:bg-[rgba(253,251,245,0.12)]'
                                }`}
                        >
                            {cat.icon} {cat.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Featured section (only when viewing all and no search) */}
            {selectedCategory === 'all' && !searchQuery && featuredVideos.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-[10px] uppercase tracking-wider text-[rgba(253,251,245,0.5)] mb-3">
                        Featured
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {featuredVideos.slice(0, 4).map(video => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onClick={setSelectedVideo}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Video grid */}
            <div>
                {selectedCategory !== 'all' || searchQuery ? (
                    <h3 className="text-[10px] uppercase tracking-wider text-[rgba(253,251,245,0.5)] mb-3">
                        {searchQuery
                            ? `Search results (${filteredVideos.length})`
                            : VIDEO_CATEGORIES.find(c => c.id === selectedCategory)?.label
                        }
                    </h3>
                ) : (
                    <h3 className="text-[10px] uppercase tracking-wider text-[rgba(253,251,245,0.5)] mb-3">
                        All Videos
                    </h3>
                )}

                {filteredVideos.length === 0 ? (
                    <div className="py-8 text-center text-[rgba(253,251,245,0.4)] text-[11px]">
                        No videos found
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredVideos.map(video => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onClick={setSelectedVideo}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Video player modal */}
            <VideoPlayerModal
                video={selectedVideo}
                isOpen={!!selectedVideo}
                onClose={() => setSelectedVideo(null)}
            />
        </div>
    );
}

/**
 * Compact video list for embedding in other sections
 */
export function VideoListCompact({ videos, maxItems = 3 }) {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const { getVideoState } = useVideoStore();

    const displayVideos = videos.slice(0, maxItems);

    return (
        <div>
            <div className="space-y-2">
                {displayVideos.map(video => {
                    const state = getVideoState(video.id);
                    return (
                        <button
                            key={video.id}
                            onClick={() => setSelectedVideo(video)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(253,251,245,0.05)] transition-colors text-left"
                        >
                            {/* Thumbnail */}
                            <div className="w-16 h-9 rounded overflow-hidden bg-[rgba(0,0,0,0.3)] flex-shrink-0 relative">
                                {video.provider === 'youtube' && (
                                    <img
                                        src={`https://img.youtube.com/vi/${video.externalId}/default.jpg`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                {state.completed && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-green-400 text-xs">✓</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-white truncate">{video.title}</p>
                                <p className="text-[9px] text-[rgba(253,251,245,0.4)]">{video.duration}</p>
                            </div>

                            {/* Play icon */}
                            <span className="text-[rgba(253,251,245,0.4)]">▶</span>
                        </button>
                    );
                })}
            </div>

            <VideoPlayerModal
                video={selectedVideo}
                isOpen={!!selectedVideo}
                onClose={() => setSelectedVideo(null)}
            />
        </div>
    );
}
