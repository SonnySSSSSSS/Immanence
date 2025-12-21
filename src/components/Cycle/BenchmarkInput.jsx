// src/components/Cycle/BenchmarkInput.jsx
// Self-reported benchmark input form
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logBenchmark } from '../../services/benchmarkManager';

const BENCHMARK_FIELDS = {
    breath: [
        { key: 'holdDuration', label: 'Breath Hold Duration', unit: 'seconds', type: 'number' },
        { key: 'cycleConsistency', label: 'Cycle Consistency', unit: '1-10', type: 'number', max: 10 },
    ],
    focus: [
        { key: 'flameDuration', label: 'Sustained Focus Duration', unit: 'minutes', type: 'number' },
        { key: 'distractionCount', label: 'Distraction Count', unit: 'count', type: 'number' },
    ],
    body: [
        { key: 'scanCompletionTime', label: 'Body Scan Completion Time', unit: 'minutes', type: 'number' },
        { key: 'awarenessResolution', label: 'Awareness Resolution', unit: '1-10', type: 'number', max: 10 },
    ],
};

export function BenchmarkInput({ isOpen, onClose, initialPath = 'breath' }) {
    const [selectedPath, setSelectedPath] = useState(initialPath);
    const [values, setValues] = useState({});
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const fields = BENCHMARK_FIELDS[selectedPath];

    const handleSubmit = () => {
        // Log each filled benchmark
        Object.entries(values).forEach(([metricName, value]) => {
            if (value) {
                logBenchmark(selectedPath, metricName, parseFloat(value));
            }
        });

        // Reset and close
        setValues({});
        setNotes('');
        onClose();
    };

    const hasAnyValue = Object.values(values).some((v) => v);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/80" onClick={onClose} />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-md bg-[#161625] border border-white/10 rounded-lg p-6"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="mb-6">
                        <h3
                            className="text-xl tracking-wide font-bold text-white/90 mb-2"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Log Benchmark
                        </h3>
                        <p
                            className="text-sm text-white/60 tracking-tight font-medium"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Self-report your current capacity metrics
                        </p>
                    </div>

                    {/* Path Selection */}
                    <div className="mb-6">
                        <div
                            className="text-xs text-white/50 tracking-tight font-medium mb-2"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Select Path
                        </div>
                        <div className="flex gap-2">
                            {['breath', 'focus', 'body'].map((path) => (
                                <button
                                    key={path}
                                    onClick={() => {
                                        setSelectedPath(path);
                                        setValues({});
                                    }}
                                    className={`flex-1 px-3 py-2 rounded tracking-tight font-medium text-sm capitalize transition-all ${selectedPath === path
                                        ? 'bg-[#fcd34d] text-black'
                                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                                        }`}
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    {path}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Metric Fields */}
                    <div className="mb-6 space-y-4">
                        {fields.map((field) => (
                            <div key={field.key}>
                                <label
                                    className="block text-xs text-white/50 tracking-tight font-medium mb-2"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    {field.label} <span className="text-white/30">({field.unit})</span>
                                </label>
                                <input
                                    type={field.type}
                                    max={field.max}
                                    min="0"
                                    step={field.type === 'number' ? '1' : undefined}
                                    value={values[field.key] || ''}
                                    onChange={(e) =>
                                        setValues({ ...values, [field.key]: e.target.value })
                                    }
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white/90 tracking-tight font-medium focus:outline-none focus:border-[#fcd34d]/50"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label
                            className="block text-xs text-white/50 tracking-tight font-medium mb-2"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white/90 tracking-tight font-medium focus:outline-none focus:border-[#fcd34d]/50 resize-none"
                            style={{ fontFamily: 'var(--font-body)' }}
                            rows="3"
                            placeholder="Any observations..."
                        />
                    </div>

                    {/* Info */}
                    <div className="mb-6 p-3 bg-white/5 rounded border border-white/10">
                        <p
                            className="text-xs text-white/50 tracking-tight font-medium leading-relaxed"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            These metrics are self-reported and optional. They help track capacity
                            development and inform avatar stage advancement.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 text-white/80 rounded tracking-tight font-medium transition-colors"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!hasAnyValue}
                            className={`flex-1 px-4 py-2 rounded tracking-tight font-medium transition-all ${hasAnyValue
                                ? 'bg-[#fcd34d] text-black hover:bg-[#fcd34d]/90'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Log Metrics
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
