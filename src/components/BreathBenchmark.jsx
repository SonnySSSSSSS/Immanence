import { BenchmarkBreathworkUI } from './BenchmarkBreathworkUI.jsx';
import { useBreathBenchmarkStore } from '../state/breathBenchmarkStore';
export function BreathBenchmark({ isOpen, onClose, onSave = null }) {
    const setBenchmark = useBreathBenchmarkStore((s) => s.setBenchmark);

    const handleCancel = () => {
        onClose?.(null);
    };

    const handleSave = (results) => {
        if (typeof onSave === 'function') {
            onSave(results);
        } else {
            setBenchmark(results);
        }
        onClose?.(results);
    };

    return (
        <BenchmarkBreathworkUI
            isOpen={isOpen}
            dayNumber={1}
            comparisonBaseline={null}
            onCancel={handleCancel}
            onSave={handleSave}
        />
    );
}
