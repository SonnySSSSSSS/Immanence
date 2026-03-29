import React from 'react';
import { useCurriculumStore } from '../../state/curriculumStore';
import { useNavigationStore } from '../../state/navigationStore';
import DevButton from '../devpanel/ui/DevButton.jsx';
import DestructiveButton from '../devpanel/ui/DestructiveButton.jsx';
import Section from '../devpanel/ui/Section.jsx';

function CurriculumSection({
    expanded,
    onToggle,
    armed,
    handleDestructive,
    destructiveLocked,
    makeGuardedAction,
    isLight = false
}) {
    const getCurrentDayNumber = useCurriculumStore(s => s.getCurrentDayNumber);
    const _devSetDay = useCurriculumStore(s => s._devSetDay);
    const _devCompleteDay = useCurriculumStore(s => s._devCompleteDay);
    const logLegCompletion = useCurriculumStore(s => s.logLegCompletion);
    const logDayCompletion = useCurriculumStore(s => s.logDayCompletion);
    const dayCompletions = useCurriculumStore(s => s.dayCompletions);
    const legCompletions = useCurriculumStore(s => s.legCompletions);
    const onboardingComplete = useCurriculumStore(s => s.onboardingComplete);
    const _devReset = useCurriculumStore(s => s._devReset);
    const getActiveCurriculum = useCurriculumStore(s => s.getActiveCurriculum);

    const activePathId = useNavigationStore(s => s.activePath?.activePathId ?? null);
    const abandonPath = useNavigationStore(s => s.abandonPath);

    const curriculum = getActiveCurriculum();
    const totalDays = curriculum?.duration || 14;
    const totalLegsPerDay = curriculum?.days?.[0]?.legs?.length || 2;

    const currentDay = getCurrentDayNumber();
    const completedDays = Object.keys(dayCompletions).filter(d => dayCompletions[d].completed).length;
    const completedLegs = Object.keys(legCompletions).length;

    const [simDays, setSimDays] = React.useState(totalDays);
    const [simLegs, setSimLegs] = React.useState(totalLegsPerDay);

    const ensureOnboarding = () => {
        const state = useCurriculumStore.getState();
        if (state.onboardingComplete && state.curriculumStartDate && state.practiceTimeSlots?.length > 0) {
            return;
        }
        const defaultTimeSlots = state.practiceTimeSlots?.length > 0
            ? state.practiceTimeSlots
            : ['08:00', '20:00'];
        const defaultThoughts = state.thoughtCatalog?.length > 0
            ? []
            : [
                { text: 'I am not good enough', weight: 1 },
                { text: 'I always mess things up', weight: 1 },
                { text: 'Everyone else has it figured out', weight: 0 },
                { text: 'I should be better by now', weight: 0 },
                { text: 'Nothing ever works out', weight: 0 },
            ];
        state.completeOnboarding(defaultTimeSlots, defaultThoughts);
        console.log('[DevPanel] Auto-completed onboarding with defaults:', {
            timeSlots: defaultTimeSlots,
            thoughts: defaultThoughts.length,
            curriculumStartDate: useCurriculumStore.getState().curriculumStartDate,
        });
    };

    const simulateEntireProgram = () => {
        ensureOnboarding();
        console.log('[DevPanel] Starting curriculum simulation:', { simDays, simLegs });
        for (let day = 1; day <= simDays; day++) {
            for (let leg = 1; leg <= simLegs; leg++) {
                logLegCompletion(day, leg, {
                    duration: 5 + Math.floor(Math.random() * 3),
                    focusRating: 3 + Math.floor(Math.random() * 3),
                    challenges: [],
                    notes: `Dev simulated day ${day}, leg ${leg}`,
                });
            }
            logDayCompletion(day, {
                duration: simLegs * 5,
                focusRating: 4,
                challenges: [],
                notes: `Dev simulated day ${day}`,
            });
        }
        console.log(`✅ Completed curriculum simulation: ${simDays} days × ${simLegs} legs, ${simDays} dayCompletions written`);
    };

    const completeCurrentDay = () => {
        ensureOnboarding();
        const day = useCurriculumStore.getState().getCurrentDayNumber();
        console.log('[DevPanel] Completing current day:', day);
        logLegCompletion(day, 1, {
            duration: 5,
            focusRating: 4,
            challenges: [],
            notes: 'Dev completed leg 1',
        });
        logLegCompletion(day, 2, {
            duration: 5,
            focusRating: 5,
            challenges: [],
            notes: 'Dev completed leg 2',
        });
        logDayCompletion(day, {
            duration: 10,
            focusRating: 4,
            challenges: [],
            notes: `Dev completed day ${day}`,
        });
        console.log(`✅ Completed Day ${day}: 2 legs + dayCompletion written`);
    };

    const quickSetupOnly = () => {
        ensureOnboarding();
        console.log('✅ Onboarding complete — curriculum card should now be visible');
    };

    const populateSampleThoughts = () => {
        const { completeOnboarding, practiceTimeSlots } = useCurriculumStore.getState();
        const defaultTimeSlots = practiceTimeSlots?.length > 0 ? practiceTimeSlots : ['08:00', '20:00'];
        const sampleThoughts = [
            { text: 'I am not good enough', weight: 1 },
            { text: 'I always mess things up', weight: 1 },
            { text: 'Everyone else has it figured out', weight: 0 },
            { text: 'I should be better by now', weight: 0 },
            { text: 'Nothing ever works out', weight: 0 },
            { text: 'I am capable of growth', weight: 0 },
            { text: 'This moment is full of potential', weight: 0 },
        ];
        completeOnboarding(defaultTimeSlots, sampleThoughts);
        console.log('✅ Populated 7 sample thoughts (2 priority, 5 normal) + onboarding complete');
    };

    const testWeightedRandom = () => {
        const { getWeightedRandomThought } = useCurriculumStore.getState();
        const thought = getWeightedRandomThought();
        if (thought) {
            console.log('🎲 Random thought selected:', thought.text, `(weight: ${thought.weight})`);
        } else {
            console.log('❌ No thoughts in catalog');
        }
    };

    void _devCompleteDay;

    return (
        <Section
            title="Curriculum Simulation"
            expanded={expanded}
            onToggle={onToggle}
            isLight={isLight}
        >
            {!onboardingComplete && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-300">
                    ⚠️ Onboarding not complete — curriculum card won't render. Click 'Quick Setup' or any simulation button below.
                </div>
            )}

            {activePathId && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300">
                    ⚠️ Active navigation path "{activePathId}" is blocking the curriculum card.
                    <button
                        className="ml-2 underline hover:text-orange-200 transition-colors"
                        onClick={() => { abandonPath(); console.log('✅ Navigation path cleared — curriculum card should now be visible'); }}
                    >
                        Clear path
                    </button>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-white/40">Current Day</div>
                    <div className="text-white/90 font-mono">{currentDay}/{totalDays}</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-white/40">Days Done</div>
                    <div className="text-white/90 font-mono">{completedDays}</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-white/40">Legs Done</div>
                    <div className="text-white/90 font-mono">{completedLegs}</div>
                </div>
            </div>

            {!onboardingComplete && (
                <div className="mb-3">
                    <DevButton onClick={quickSetupOnly}>⚡ Quick Setup (onboarding only)</DevButton>
                </div>
            )}

            <div className="grid grid-cols-4 gap-2 mb-3">
                <DevButton onClick={() => _devSetDay(1)}>Day 1</DevButton>
                <DevButton onClick={() => _devSetDay(Math.floor(totalDays / 2))}>Mid</DevButton>
                <DevButton onClick={() => _devSetDay(totalDays)}>End</DevButton>
                <DevButton onClick={() => _devSetDay(Math.min(currentDay + 1, totalDays))}>+1 Day</DevButton>
            </div>

            <div className="mb-3">
                <div className="text-xs text-white/50 mb-2">Simulation Settings</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label className="text-[10px] text-white/40 block mb-1">Days</label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={simDays}
                            onChange={(e) => setSimDays(parseInt(e.target.value) || 1)}
                            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white/90"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-white/40 block mb-1">Legs/Day</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={simLegs}
                            onChange={(e) => setSimLegs(parseInt(e.target.value) || 1)}
                            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white/90"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
                <DevButton onClick={completeCurrentDay}>Complete Today</DevButton>
                <DevButton onClick={simulateEntireProgram}>Complete All {simDays} Days</DevButton>
            </div>

            <div className="border-t border-white/10 pt-3 mt-3 mb-3">
                <div className="text-xs text-white/50 mb-2">Thought Catalog Testing</div>
                <div className="grid grid-cols-2 gap-2">
                    <DevButton onClick={populateSampleThoughts}>Add Sample Thoughts</DevButton>
                    <DevButton onClick={testWeightedRandom}>Test Weighted Selection</DevButton>
                </div>
            </div>

            <div style={destructiveLocked ? { opacity: 0.5 } : undefined}>
                <DestructiveButton
                    label="Reset Curriculum"
                    armed={armed === 'curriculum'}
                    onArm={makeGuardedAction(() => handleDestructive('curriculum', _devReset))}
                />
                {destructiveLocked && (
                    <div className="text-[10px] text-white/50 mt-1">
                        Arm to enable destructive actions (prod only).
                    </div>
                )}
            </div>
        </Section>
    );
}

export default CurriculumSection;
