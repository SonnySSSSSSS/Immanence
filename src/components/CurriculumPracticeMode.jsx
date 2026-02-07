import { useCurriculumStore } from '../state/curriculumStore.js';

/**
 * Wrapper component that displays curriculum practice guidance
 * Shows the day's intention, practice type, and instructions before/during practice
 */
export function CurriculumPracticeMode() {
    const { 
        getActivePracticeDay, 
        activePracticeSession,
    } = useCurriculumStore();

    const practiceDay = getActivePracticeDay();
    
    if (!activePracticeSession || !practiceDay) {
        return null;
    }

    return (
        <div className="mb-6 p-4 rounded-xl" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--accent-30)',
        }}>
            <div className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60 mb-2">
                Curriculum Day {activePracticeSession}
            </div>
            
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {practiceDay.title}
            </h3>
            
            <p className="text-[13px] leading-relaxed mb-3 opacity-80">
                {practiceDay.description}
            </p>
            
            <div className="p-3 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                <p className="text-[12px] italic">
                    "{practiceDay.intention}"
                </p>
            </div>
        </div>
    );
}

export default CurriculumPracticeMode;