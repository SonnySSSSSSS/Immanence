// src/components/navigation/NavigationPathReport.jsx
import { useEffect, useState } from 'react';
import { useNavigationStore } from '../../state/navigationStore.js';
import { useProgressStore } from '../../state/progressStore.js';
import {
    buildPathReportKey,
    loadPathReports,
    savePathReport,
    generatePathReport,
} from '../../reporting/pathReport.js';

export function NavigationPathReport() {
    const activePath = useNavigationStore(s => s.activePath);
    const sessionsV2 = useProgressStore(s => s.sessionsV2);
    const [report, setReport] = useState(null);

    useEffect(() => {
        if (!activePath) {
            setReport(null);
            return;
        }

        const pathId = activePath.activePathId || null;
        const startedAt = activePath.startedAt || null;
        if (!pathId || !startedAt) {
            setReport(null);
            return;
        }

        const key = buildPathReportKey(pathId, startedAt);
        const reports = loadPathReports();
        let nextReport = key ? reports[key] : null;

        const endsAt = activePath.endsAt ? new Date(activePath.endsAt) : null;
        const shouldGenerate = !nextReport && endsAt && endsAt <= new Date();
        if (shouldGenerate) {
            nextReport = generatePathReport({
                activePath,
                sessions: sessionsV2 || [],
            });
            if (nextReport) {
                savePathReport(nextReport);
            }
        }

        setReport(nextReport || null);
    }, [activePath, sessionsV2]);

    if (!report) return null;

    const { facts, patterns, nextSteps } = report;

    return (
        <div
            className="mt-6 w-full rounded-2xl border p-4"
            style={{
                background: 'rgba(0, 0, 0, 0.04)',
                borderColor: 'rgba(0, 0, 0, 0.12)'
            }}
        >
            <div className="text-xs uppercase tracking-wider mb-3" style={{ fontWeight: 700 }}>
                Path Report
            </div>

            <div className="mb-4">
                <div className="text-[11px] uppercase tracking-wider mb-2" style={{ opacity: 0.6 }}>
                    Facts
                </div>
                <div className="text-sm">
                    <div>Sessions: {facts?.sessionsCompleted || 0}</div>
                    <div>Days practiced: {facts?.daysPracticed || 0}</div>
                    <div>Days elapsed: {facts?.daysElapsed || 0}</div>
                    <div>Consistency: {facts?.consistencyPct || 0}%</div>
                    <div>Total minutes: {facts?.totalMinutes || 0}</div>
                    <div>Avg minutes/session: {facts?.avgMinutesPerSession || 0}</div>
                </div>
            </div>

            <div className="mb-4">
                <div className="text-[11px] uppercase tracking-wider mb-2" style={{ opacity: 0.6 }}>
                    Patterns
                </div>
                <div className="text-sm">
                    <div>Most common practice: {patterns?.mostCommonPracticeId || 'None'}</div>
                    <div>Most common mode: {patterns?.mostCommonMode || 'None'}</div>
                    <div>Most common time: {patterns?.mostCommonTimeBucket || 'None'}</div>
                </div>
                {patterns?.noteLines?.length ? (
                    <div className="text-xs mt-2" style={{ opacity: 0.7 }}>
                        {patterns.noteLines.join(' ')}
                    </div>
                ) : null}
            </div>

            <div>
                <div className="text-[11px] uppercase tracking-wider mb-2" style={{ opacity: 0.6 }}>
                    Next Steps
                </div>
                {nextSteps?.length ? (
                    <div className="flex flex-wrap gap-2">
                        {nextSteps.map((step) => (
                            <button
                                key={step}
                                className="px-3 py-1 rounded-full text-xs border"
                                style={{ borderColor: 'rgba(0, 0, 0, 0.15)' }}
                            >
                                {step}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs" style={{ opacity: 0.6 }}>
                        No next steps recorded yet.
                    </div>
                )}
            </div>
        </div>
    );
}

export default NavigationPathReport;
