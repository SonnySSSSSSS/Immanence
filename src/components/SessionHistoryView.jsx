// src/components/SessionHistoryView.jsx
// Detailed list and filtering for practice sessions

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressStore } from '../state/progressStore.js';
import { useLunarStore } from '../state/lunarStore.js';
import { CHALLENGE_TAXONOMY, ATTENTION_QUALITIES } from '../state/journalStore.js';

export function SessionHistoryView({ onClose }) {
    const { stage } = useLunarStore();
    const { sessions } = useProgressStore();
    const isLight = stage === 'flame';

    // Filters
    const [filterType, setFilterType] = useState('all');
    const [filterAttention, setFilterAttention] = useState('all');
    const [filterChallenge, setFilterChallenge] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    // Filter Logic
    const filteredSessions = useMemo(() => {
        return [...sessions].reverse().filter(session => {
            const matchesType = filterType === 'all' || session.domain === filterType;
            const journal = session.journal || {};
            const matchesAttention = filterAttention === 'all' || journal.attentionQuality === filterAttention;
            const matchesChallenge = filterChallenge === 'all' || journal.challengeTag === filterChallenge;
            const matchesSearch = !searchQuery || 
                (journal.technicalNote?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (session.domain?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (session.metadata?.subType?.toLowerCase().includes(searchQuery.toLowerCase()));
            
            return matchesType && matchesAttention && matchesChallenge && matchesSearch;
        });
    }, [sessions, filterType, filterAttention, filterChallenge, searchQuery]);

    // Theme Colors
    const bgColor = isLight ? 'rgba(245, 239, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const cardBg = isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.03)';
    const textMain = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const textSub = isLight ? 'rgba(65, 45, 25, 0.6)' : 'rgba(253, 251, 245, 0.5)';
    const borderColor = isLight ? 'rgba(160, 140, 120, 0.25)' : 'rgba(253, 251, 245, 0.1)';
    const accentColor = isLight ? 'rgba(139, 159, 136, 0.9)' : 'rgba(126, 217, 87, 0.8)';

    const practiceTypes = ['all', ...new Set(sessions.map(s => s.domain))];

    return (
        <motion.div 
            className="fixed inset-0 z-[60] flex flex-col pt-16 pb-6 px-4"
            style={{ backgroundColor: bgColor }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
        >
            {/* Header Area */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: textMain }}>Session Archive</h2>
                    <p className="text-xs font-medium uppercase tracking-widest opacity-60" style={{ color: textSub }}>
                        {filteredSessions.length} entries found
                    </p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 rounded-full transition-colors"
                    style={{ backgroundColor: cardBg, color: textMain }}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 mb-6 overscroll-contain overflow-x-auto pb-2 no-scrollbar">
                {/* Type Filter */}
                <select 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-2 rounded-lg text-xs font-bold border-none outline-none appearance-none cursor-pointer"
                    style={{ backgroundColor: cardBg, color: textMain, border: `1px solid ${borderColor}` }}
                >
                    {practiceTypes.map(t => (
                        <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                </select>

                {/* Attention Filter */}
                <select 
                    value={filterAttention} 
                    onChange={e => setFilterAttention(e.target.value)}
                    className="px-3 py-2 rounded-lg text-xs font-bold border-none outline-none appearance-none cursor-pointer"
                    style={{ backgroundColor: cardBg, color: textMain, border: `1px solid ${borderColor}` }}
                >
                    <option value="all">All Attention</option>
                    {ATTENTION_QUALITIES.map(q => <option key={q} value={q}>{q.charAt(0).toUpperCase() + q.slice(1)}</option>)}
                </select>

                {/* Challenge Filter */}
                <select 
                    value={filterChallenge} 
                    onChange={e => setFilterChallenge(e.target.value)}
                    className="px-3 py-2 rounded-lg text-xs font-bold border-none outline-none appearance-none cursor-pointer"
                    style={{ backgroundColor: cardBg, color: textMain, border: `1px solid ${borderColor}` }}
                >
                    <option value="all">All Challenges</option>
                    {Object.keys(CHALLENGE_TAXONOMY).map(k => <option key={k} value={k}>{CHALLENGE_TAXONOMY[k].label}</option>)}
                </select>
            </div>

            {/* List View */}
            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3">
                <AnimatePresence>
                    {filteredSessions.map((session) => {
                        const isExpanded = expandedId === session.id;
                        const journal = session.journal || {};
                        const date = new Date(session.date);

                        return (
                            <motion.div
                                key={session.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                                className="p-4 rounded-xl cursor-pointer transition-shadow"
                                style={{ 
                                    backgroundColor: cardBg, 
                                    border: `1px solid ${isExpanded ? accentColor : borderColor}`,
                                    boxShadow: isExpanded ? '0 10px 25px -5px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: textSub }}>
                                                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {session.exit_type === 'early_exit' || session.exit_type === 'abandoned' && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold uppercase tracking-tighter">
                                                    {session.exit_type === 'abandoned' ? 'Abandoned' : 'Early Exit'}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-black leading-tight" style={{ color: textMain }}>
                                            {(session.metadata?.subType || session.domain || 'Practice').replace(/_/g, ' ')}
                                        </h4>
                                        <div className="flex gap-4 items-center">
                                            <span className="text-xs font-bold" style={{ color: textSub }}>
                                                {session.duration}m
                                            </span>
                                            {journal.attentionQuality && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                                                    <span className="text-xs font-medium capitalize" style={{ color: textMain }}>{journal.attentionQuality}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {journal.challengeTag && (
                                        <div 
                                            className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest"
                                            style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', color: textSub }}
                                        >
                                            {CHALLENGE_TAXONOMY[journal.challengeTag]?.label}
                                        </div>
                                    )}
                                </div>

                                {isExpanded && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 pt-4 border-t overflow-hidden"
                                        style={{ borderColor }}
                                    >
                                        {journal.technicalNote ? (
                                            <p className="text-sm italic leading-relaxed" style={{ color: textMain }}>
                                                "{journal.technicalNote}"
                                            </p>
                                        ) : (
                                            <p className="text-xs italic opacity-40" style={{ color: textSub }}>No technical notes logged for this session.</p>
                                        )}
                                        
                                        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold">
                                            <div className="px-2 py-1 rounded" style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', color: textSub }}>
                                                DOMAIN: {session.domain}
                                            </div>
                                            {session.metadata?.accuracy !== undefined && (
                                                <div className="px-2 py-1 rounded text-emerald-500 bg-emerald-500/5">
                                                    ACCURACY: {Math.round(session.metadata.accuracy * 100)}%
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
