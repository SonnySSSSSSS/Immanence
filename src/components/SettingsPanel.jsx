// src/components/SettingsPanel.jsx
// Settings panel with reset functionality for pilot testing
import React from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { clearSettingsPersistedState, useSettingsStore } from '../state/settingsStore';
// NOTE: Auth feature disabled - lazy import to prevent Supabase CORS errors
const ENABLE_AUTH = false;
const getSupabase = () => import('../lib/supabaseClient').then(m => m.supabase);

export function SettingsPanel({ isOpen, onClose, onSignedOut }) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const resetSettings = useSettingsStore(s => s.resetSettings);

  if (!isOpen) return null;

  const handleReset = () => {
    const confirmed = window.confirm(
      'Reset all local data?\n\nThis will clear:\n• Curriculum progress\n• Navigation/path data\n• All completion logs\n• Feedback entries\n\nThis cannot be undone. Continue?'
    );

    if (confirmed) {
      // Clear all immanenceOS localStorage keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('immanenceOS.')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Reload the app
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    if (ENABLE_AUTH) {
      const supabase = await getSupabase();
      await supabase.auth.signOut();
    }
    resetSettings();
    clearSettingsPersistedState();
    onClose?.();
    onSignedOut?.();
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      window.history.replaceState(null, "", baseUrl);
    } catch {
      // Ignore history errors in non-browser contexts
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl border p-6"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, #faf6ee 0%, #f5efe5 100%)'
            : 'linear-gradient(135deg, rgb(26, 15, 28) 0%, rgb(21, 11, 22) 100%)',
          borderColor: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-20)',
          boxShadow: isLight
            ? '0 20px 60px rgba(0, 0, 0, 0.15)'
            : '0 20px 60px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 
            className="text-xl font-bold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: isLight ? '#3c3020' : '#fdfbf5',
            }}
          >
            Settings
          </h2>
          <p 
            className="text-sm opacity-70"
            style={{
              fontFamily: 'var(--font-body)',
              color: isLight ? '#3c3020' : '#fdfbf5',
            }}
          >
            Manage your local data
          </p>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full px-4 py-3 rounded-lg font-bold text-sm transition-all mb-4"
          style={{
            background: isLight 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          }}
        >
          Reset Local Data
        </button>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-3 rounded-lg font-bold text-sm transition-all mb-4"
          style={{
            background: isLight 
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          }}
        >
          Sign Out
        </button>

        {/* Warning Text */}
        <p 
          className="text-xs opacity-60 mb-4"
          style={{
            fontFamily: 'var(--font-body)',
            color: isLight ? '#3c3020' : '#fdfbf5',
          }}
        >
          This will clear all progress and cannot be undone.
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: isLight 
              ? 'rgba(60, 50, 35, 0.08)'
              : 'rgba(255, 255, 255, 0.08)',
            border: isLight 
              ? '1px solid rgba(60, 50, 35, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            color: isLight ? '#3c3020' : '#fdfbf5',
            fontFamily: 'var(--font-display)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
