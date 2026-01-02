// src/components/ErrorBoundary.jsx
// Phase 5: Catch and display errors gracefully

import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return <ErrorDisplay error={this.state.error} errorInfo={this.state.errorInfo} onReset={() => this.setState({ hasError: false, error: null, errorInfo: null })} />;
        }
        return this.props.children;
    }
}

function ErrorDisplay({ error, errorInfo, onReset }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';

    return (
        <div style={{ padding: '40px 20px', backgroundColor: bgColor, color: textColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: '600px', border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '40px', backgroundColor: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}>
                <h1 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>⚠️ Something went wrong</h1>
                <p style={{ margin: '0 0 20px 0', fontSize: '14px', opacity: 0.8, lineHeight: '1.6' }}>An unexpected error occurred. The error has been logged and our team will investigate.</p>
                {error && (
                    <details style={{ marginBottom: '20px', padding: '12px', backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: '6px', border: `1px solid ${borderColor}`, cursor: 'pointer' }}>
                        <summary style={{ fontWeight: '600', fontSize: '12px', userSelect: 'none' }}>Error details</summary>
                        <pre style={{ margin: '12px 0 0 0', fontSize: '11px', overflow: 'auto', maxHeight: '200px', opacity: 0.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error.toString()}{errorInfo?.componentStack}</pre>
                    </details>
                )}
                <button onClick={onReset} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Try Again</button>
            </div>
        </div>
    );
}

export default ErrorBoundary;