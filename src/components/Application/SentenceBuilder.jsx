// src/components/Application/SentenceBuilder.jsx
// Natural language sentence builder - "Mad Libs" style input
// Replaces form fields with tappable tokens in a sentence

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Bottom Sheet Modal for token editing - compact and mystical
function TokenEditSheet({ isOpen, onClose, type, value, onChange }) {
    const inputRef = useRef(null);

    // Quick options for different types
    const quickOptions = {
        date: ['Today', 'Yesterday', 'This morning', 'Last night', 'Earlier today'],
        time: ['Just now', 'Morning', 'Afternoon', 'Evening', 'Night'],
        location: ['Home', 'Work', 'Outside', 'Online', 'In transit'],
    };

    const options = quickOptions[type] || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50"
                        onClick={onClose}
                    />

                    {/* Sheet - Compact */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6"
                        style={{
                            maxHeight: '40vh',
                            background: 'linear-gradient(180deg, rgba(15,15,26,0.98) 0%, rgba(10,10,18,0.99) 100%)',
                            borderTop: '1px solid var(--accent-20)',
                            borderRadius: '20px 20px 0 0',
                        }}
                    >
                        {/* Handle */}
                        <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mb-3" />

                        {/* Title */}
                        <h3
                            className="text-xs uppercase tracking-[0.2em] text-center mb-3"
                            style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--accent-color)', opacity: 0.8 }}
                        >
                            {type === 'date' ? 'When?' : type === 'time' ? 'What time?' : 'Where?'}
                        </h3>

                        {/* Quick options - pill buttons */}
                        <div className="flex flex-wrap gap-2 justify-center mb-3">
                            {options.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => { onChange(opt); onClose(); }}
                                    className="px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105"
                                    style={{
                                        background: value === opt
                                            ? 'var(--accent-20)'
                                            : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${value === opt ? 'var(--accent-40)' : 'rgba(255,255,255,0.08)'}`,
                                        color: value === opt ? 'var(--accent-color)' : 'rgba(255,255,255,0.6)',
                                        fontFamily: 'Crimson Pro, serif',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {/* Custom input - minimal */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={`Or type custom ${type}...`}
                            className="w-full px-3 py-2 rounded-lg text-center text-sm bg-white/5 border border-white/10 focus:border-[var(--accent-30)] focus:outline-none mb-3"
                            style={{
                                fontFamily: 'Crimson Pro, serif',
                                color: 'rgba(255,255,255,0.85)',
                            }}
                        />

                        {/* Done button - subtle */}
                        <button
                            onClick={onClose}
                            className="w-full py-2 rounded-lg text-center text-xs uppercase tracking-widest transition-all hover:opacity-80"
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--accent-30)',
                                color: 'var(--accent-color)',
                                fontFamily: 'Outfit, sans-serif',
                            }}
                        >
                            Done
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Tappable Token within the sentence
function Token({ value, placeholder, type, onClick, isActive }) {
    return (
        <motion.button
            onClick={onClick}
            className="inline-block px-2 py-0.5 mx-1 rounded transition-all"
            animate={{
                scale: isActive ? 1.05 : 1,
                backgroundColor: isActive ? 'rgba(255,220,120,0.15)' : 'rgba(255,220,120,0.08)',
            }}
            whileHover={{ backgroundColor: 'rgba(255,220,120,0.2)' }}
            style={{
                borderBottom: '1px dashed var(--accent-40)',
            }}
        >
            <span
                className="text-lg"
                style={{
                    fontFamily: 'Crimson Pro, serif',
                    fontWeight: 500,
                    color: value ? 'var(--accent-color)' : 'rgba(255,220,120,0.5)',
                    fontStyle: value ? 'normal' : 'italic',
                }}
            >
                {value || placeholder}
            </span>
        </motion.button>
    );
}

export function SentenceBuilder({ values = {}, onChange }) {
    const [activeToken, setActiveToken] = useState(null);

    const handleTokenChange = (field, value) => {
        onChange(field, value);
    };

    const handleTokenClick = (field) => {
        setActiveToken(field);
    };

    const handleSheetClose = () => {
        setActiveToken(null);
    };

    return (
        <div className="w-full">
            {/* The Sentence */}
            <div
                className="text-center py-6 px-4 leading-relaxed"
                style={{
                    fontFamily: 'Crimson Pro, serif',
                    fontSize: '18px',
                    color: 'rgba(253,251,245,0.85)',
                }}
            >
                <span>It happened on </span>
                <Token
                    value={values.date}
                    placeholder="when?"
                    type="date"
                    onClick={() => handleTokenClick('date')}
                    isActive={activeToken === 'date'}
                />
                <span> at </span>
                <Token
                    value={values.time}
                    placeholder="what time?"
                    type="time"
                    onClick={() => handleTokenClick('time')}
                    isActive={activeToken === 'time'}
                />
                <span> in </span>
                <Token
                    value={values.location}
                    placeholder="where?"
                    type="location"
                    onClick={() => handleTokenClick('location')}
                    isActive={activeToken === 'location'}
                />
                <span>.</span>
            </div>

            {/* Bottom Sheet for editing */}
            <TokenEditSheet
                isOpen={activeToken !== null}
                onClose={handleSheetClose}
                type={activeToken}
                value={activeToken ? values[activeToken] : ''}
                onChange={(val) => handleTokenChange(activeToken, val)}
            />
        </div>
    );
}

// Actor/Action Builder - Typography focused flow
export function ActorActionBuilder({ values = {}, onChange }) {
    const [activeField, setActiveField] = useState(null);

    const fields = [
        { key: 'actor', prompt: 'Who?', placeholder: 'the person' },
        { key: 'action', prompt: 'Did what?', placeholder: 'the action' },
        { key: 'recipient', prompt: 'To whom?', placeholder: 'optional', optional: true },
    ];

    return (
        <div className="w-full space-y-8 py-6">
            {fields.map((field) => (
                <motion.div
                    key={field.key}
                    className="text-center"
                    animate={{
                        opacity: activeField === field.key ? 1 : activeField ? 0.5 : 0.9,
                    }}
                >
                    {/* Prompt */}
                    <div
                        className="text-[11px] uppercase tracking-[0.2em] mb-2"
                        style={{
                            color: 'rgba(255,255,255,0.4)',
                            fontFamily: 'Outfit, sans-serif',
                        }}
                    >
                        {field.prompt}
                    </div>

                    {/* Input - styled as typography, not form */}
                    <input
                        type="text"
                        value={values[field.key] || ''}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        onFocus={() => setActiveField(field.key)}
                        onBlur={() => setActiveField(null)}
                        placeholder={field.placeholder}
                        className="w-full max-w-xs mx-auto bg-transparent text-center text-2xl focus:outline-none border-b-2 pb-2 transition-all"
                        style={{
                            fontFamily: "'Crimson Pro', serif",
                            fontWeight: 500,
                            color: values[field.key] ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)',
                            borderColor: activeField === field.key
                                ? 'var(--accent-50)'
                                : values[field.key]
                                    ? 'var(--accent-20)'
                                    : 'rgba(255,255,255,0.1)',
                        }}
                    />

                    {/* Optional indicator */}
                    {field.optional && !values[field.key] && (
                        <div
                            className="text-[9px] mt-1 italic"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                            (optional)
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
