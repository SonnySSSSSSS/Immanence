import { HomeSnowVipassana } from './HomeSnowVipassana';
import { ThoughtLabeling } from './ThoughtLabeling';

export function VipassanaVisual({
    isActive = false,
    variant = 'thought-labeling', // 'thought-labeling' or 'sakshi'
    onComplete,
    onCancel,
    onExit,
    durationSeconds,
    themeId = 'bird',
}) {
    if (!isActive) return null;

    // Sakshi variant: "Watching Snow Window" Portals
    if (variant === 'sakshi') {
        return (
            <HomeSnowVipassana 
                isActive={isActive}
                onComplete={onComplete}
                onExit={onExit || onCancel}
            />
        );
    }

    // Default: Thought Labeling (Stamps/Canvas)
    return (
        <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
            <ThoughtLabeling 
                theme={themeId}
                durationSeconds={durationSeconds}
                onComplete={onComplete}
                onExit={onExit || onCancel}
            />
        </div>
    );
}

export default VipassanaVisual;
