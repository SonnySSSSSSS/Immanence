// src/components/dev/LLMTestPanel.jsx
// Quick test component for verifying LLM service connection

import React, { useState } from 'react';
import { sendToLLM, checkLLMAvailability, validateMirrorEntry } from '../../services/llmService.js';

export function LLMTestPanel() {
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const testConnection = async () => {
        setLoading(true);
        setTestResult(null);

        try {
            const available = await checkLLMAvailability();
            if (!available) {
                setTestResult({ success: false, error: 'Worker not reachable' });
                setLoading(false);
                return;
            }

            const result = await sendToLLM(
                'You are a helpful assistant. Respond with exactly: "Connection successful"',
                'Test connection'
            );

            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const testMirrorValidation = async () => {
        setLoading(true);
        setTestResult(null);

        try {
            const result = await validateMirrorEntry({
                context: { date: '2024-01-15', time: '3pm', location: 'office' },
                actor: 'my manager',
                action: 'raised his voice because he was angry',
                recipient: 'at me during the meeting'
            });

            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-black/20 rounded-lg border border-white/10">
            <div className="text-sm font-medium mb-3 text-purple-300">LLM Service Test</div>

            <div className="space-y-2 mb-4">
                <button
                    onClick={testConnection}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-purple-500/20 border border-purple-400/30 rounded text-xs hover:bg-purple-500/30 disabled:opacity-50"
                >
                    {loading ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                    onClick={testMirrorValidation}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-purple-500/20 border border-purple-400/30 rounded text-xs hover:bg-purple-500/30 disabled:opacity-50"
                >
                    {loading ? 'Testing...' : 'Test Mirror Validation'}
                </button>
            </div>

            {testResult && (
                <div
                    className="p-3 rounded text-xs font-mono overflow-auto max-h-64"
                    style={{
                        background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                >
                    <div className="mb-2 font-bold">
                        {testResult.success ? '✓ Success' : '✗ Failed'}
                    </div>
                    {testResult.text && (
                        <div className="mb-2">
                            <div className="text-white/50">Response:</div>
                            <div className="text-white/90">{testResult.text}</div>
                        </div>
                    )}
                    {testResult.data && (
                        <div className="mb-2">
                            <div className="text-white/50">Parsed JSON:</div>
                            <pre className="text-white/90">{JSON.stringify(testResult.data, null, 2)}</pre>
                        </div>
                    )}
                    {testResult.error && (
                        <div>
                            <div className="text-white/50">Error:</div>
                            <div className="text-red-300">{testResult.error}</div>
                            {testResult.message && <div className="text-red-200 mt-1">{testResult.message}</div>}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-3 text-[10px] text-white/30">
                Worker: {import.meta.env.VITE_LLM_PROXY_URL || 'Not configured'}
            </div>
        </div>
    );
}
