// src/components/SettingsPanel.jsx
// Settings panel with reset functionality for pilot testing
import React, { useEffect, useMemo, useState } from 'react';
import { runtimeEnv } from '../config/runtimeEnv';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { clearSettingsPersistedState, useSettingsStore } from '../state/settingsStore';
import { setAuthUser, useAuthUser } from '../state/useAuthUser.js';
const getSupabase = () => import('../lib/supabaseClient').then(m => m.supabase);

export function SettingsPanel({ isOpen, onClose, onSignedOut }) {
  // PROBE:SETTINGS_HOOK_ORDER_FIX:START
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const resetSettings = useSettingsStore(s => s.resetSettings);
  const authUser = useAuthUser();

  const currentDisplayName = useMemo(() => {
    const meta = authUser?.user_metadata || {};
    const rawName = meta?.name ?? meta?.full_name ?? '';
    return typeof rawName === 'string' ? rawName.trim() : '';
  }, [authUser?.user_metadata]);

  const currentEmail = useMemo(() => {
    return typeof authUser?.email === 'string' ? authUser.email.trim() : '';
  }, [authUser?.email]);

  const [nameDraft, setNameDraft] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [nameOk, setNameOk] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  const [emailDraft, setEmailDraft] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [emailOk, setEmailOk] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const [passwordDraft, setPasswordDraft] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [passwordOk, setPasswordOk] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [signOutErr, setSignOutErr] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!authUser?.id) return;
    setNameDraft(currentDisplayName);
    setNameErr('');
    setNameOk('');
    setNameSaving(false);
    setEmailDraft('');
    setEmailErr('');
    setEmailOk('');
    setEmailSaving(false);
    setPasswordDraft('');
    setPasswordConfirm('');
    setPasswordErr('');
    setPasswordOk('');
    setPasswordSaving(false);
    setSignOutErr('');
    setSigningOut(false);
  }, [isOpen, authUser?.id, currentDisplayName]);
  // PROBE:SETTINGS_HOOK_ORDER_FIX:END

  if (!isOpen) return null;

  const handleSignOut = async () => {
    setSignOutErr('');
    if (runtimeEnv.enableAuth) {
      try {
        setSigningOut(true);
        const supabase = await getSupabase();
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
      } catch (e) {
        setSignOutErr(e?.message || 'Failed to sign out.');
        return;
      } finally {
        setSigningOut(false);
      }
    } else {
      setAuthUser(null);
    }

    resetSettings();
    clearSettingsPersistedState();
    try {
      window.history.replaceState(null, "", runtimeEnv.baseUrl);
    } catch {
      // ignore
    }

    if (!runtimeEnv.enableAuth) {
      onClose?.();
      onSignedOut?.();
    }
  };

  const isAuthed = runtimeEnv.enableAuth && Boolean(authUser?.id);
  const canUpdateName = isAuthed && String(nameDraft || '').trim().length >= 2 && !nameSaving;
  const canUpdateEmail = isAuthed && !emailSaving;
  const canUpdatePassword = isAuthed && !passwordSaving;

  const handleUpdateName = async () => {
    setNameErr('');
    setNameOk('');

    const trimmedName = String(nameDraft || '').trim();
    if (trimmedName.length < 2) {
      setNameErr(trimmedName.length === 0 ? 'Name is required.' : 'Name must be at least 2 characters.');
      return;
    }

    try {
      setNameSaving(true);
      const supabase = await getSupabase();
      const { data, error } = await supabase.auth.updateUser({ data: { name: trimmedName, full_name: trimmedName } });
      if (error) throw error;
      if (data?.user) setAuthUser(data.user);
      setNameOk('Saved.');
    } catch (e) {
      setNameErr(e?.message || 'Failed to update name.');
    } finally {
      setNameSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailErr('');
    setEmailOk('');

    const nextEmail = String(emailDraft || '').trim();
    if (!nextEmail) {
      setEmailErr('New email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setEmailErr('Please enter a valid email.');
      return;
    }
    if (currentEmail && nextEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setEmailErr('New email must be different from current email.');
      return;
    }

    try {
      setEmailSaving(true);
      const supabase = await getSupabase();
      const { data, error } = await supabase.auth.updateUser({ email: nextEmail });
      if (error) throw error;
      if (data?.user) setAuthUser(data.user);
      setEmailOk('Check your email to confirm the change.');
    } catch (e) {
      setEmailErr(e?.message || 'Failed to initiate email change.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordErr('');
    setPasswordOk('');

    const nextPassword = String(passwordDraft || '');
    const nextConfirm = String(passwordConfirm || '');

    if (!nextPassword) {
      setPasswordErr('New password is required.');
      return;
    }
    if (nextPassword.length < 8) {
      setPasswordErr('Password must be at least 8 characters.');
      return;
    }
    if (nextPassword !== nextConfirm) {
      setPasswordErr('Passwords do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      const supabase = await getSupabase();
      const { error } = await supabase.auth.updateUser({ password: nextPassword });
      if (error) throw error;
      setPasswordDraft('');
      setPasswordConfirm('');
      setPasswordOk('Password updated.');
    } catch (e) {
      setPasswordErr(e?.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
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
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl border p-6 max-h-[85vh] overflow-y-auto"
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

        {isAuthed ? (
          <div className="mb-5">
            <div
              className="text-xs font-semibold mb-2 opacity-80"
              style={{ fontFamily: 'var(--font-display)', color: isLight ? '#3c3020' : '#fdfbf5' }}
            >
              Account
            </div>

            {/* PROBE:ACCOUNT_UPDATE_NAME:START */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: isLight ? 'rgba(60, 50, 35, 0.04)' : 'rgba(255, 255, 255, 0.06)' }}>
              <div className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: isLight ? '#3c3020' : '#fdfbf5' }}>
                Display Name
              </div>
              <input
                value={nameDraft}
                onChange={(e) => {
                  setNameDraft(e.target.value);
                  if (nameErr) setNameErr('');
                  if (nameOk) setNameOk('');
                }}
                placeholder="Name"
                autoComplete="name"
                className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${isLight ? 'rgba(60, 50, 35, 0.15)' : 'rgba(255,255,255,0.12)'}`,
                  color: isLight ? '#3c3020' : '#fdfbf5',
                  fontFamily: 'var(--font-body)',
                }}
              />
              {nameErr ? (
                <div className="text-xs mb-2" style={{ color: isLight ? '#8a1f11' : '#ffb4aa' }}>{nameErr}</div>
              ) : null}
              {nameOk ? (
                <div className="text-xs mb-2" style={{ color: isLight ? '#1c6b3a' : '#86efac' }}>{nameOk}</div>
              ) : null}
              <button
                type="button"
                onClick={handleUpdateName}
                disabled={!canUpdateName}
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  background: isLight ? 'rgba(60, 50, 35, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid rgba(60, 50, 35, 0.15)' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isLight ? '#3c3020' : '#fdfbf5',
                  fontFamily: 'var(--font-display)',
                  cursor: canUpdateName ? 'pointer' : 'not-allowed',
                }}
              >
                {nameSaving ? 'Saving…' : 'Save name'}
              </button>
            </div>
            {/* PROBE:ACCOUNT_UPDATE_NAME:END */}

            {/* PROBE:ACCOUNT_UPDATE_EMAIL:START */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: isLight ? 'rgba(60, 50, 35, 0.04)' : 'rgba(255, 255, 255, 0.06)' }}>
              <div className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: isLight ? '#3c3020' : '#fdfbf5' }}>
                Change Email
              </div>
              <div className="text-xs mb-2 opacity-70" style={{ fontFamily: 'var(--font-body)', color: isLight ? '#3c3020' : '#fdfbf5' }}>
                Current: {currentEmail || '—'}
              </div>
              <input
                value={emailDraft}
                onChange={(e) => {
                  setEmailDraft(e.target.value);
                  if (emailErr) setEmailErr('');
                  if (emailOk) setEmailOk('');
                }}
                placeholder="New email"
                autoComplete="email"
                className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${isLight ? 'rgba(60, 50, 35, 0.15)' : 'rgba(255,255,255,0.12)'}`,
                  color: isLight ? '#3c3020' : '#fdfbf5',
                  fontFamily: 'var(--font-body)',
                }}
              />
              {emailErr ? (
                <div className="text-xs mb-2" style={{ color: isLight ? '#8a1f11' : '#ffb4aa' }}>{emailErr}</div>
              ) : null}
              {emailOk ? (
                <div className="text-xs mb-2" style={{ color: isLight ? '#1c6b3a' : '#86efac' }}>{emailOk}</div>
              ) : null}
              <button
                type="button"
                onClick={handleUpdateEmail}
                disabled={!canUpdateEmail || !String(emailDraft || '').trim() || String(emailDraft || '').trim().toLowerCase() === String(currentEmail || '').toLowerCase()}
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  background: isLight ? 'rgba(60, 50, 35, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid rgba(60, 50, 35, 0.15)' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isLight ? '#3c3020' : '#fdfbf5',
                  fontFamily: 'var(--font-display)',
                  cursor: canUpdateEmail ? 'pointer' : 'not-allowed',
                }}
              >
                {emailSaving ? 'Sending…' : 'Change email'}
              </button>
              <div className="text-[11px] mt-2 opacity-70" style={{ fontFamily: 'var(--font-body)', color: isLight ? '#3c3020' : '#fdfbf5' }}>
                You may need to confirm via email before the change takes effect.
              </div>
            </div>
            {/* PROBE:ACCOUNT_UPDATE_EMAIL:END */}

            {/* PROBE:ACCOUNT_UPDATE_PASSWORD:START */}
            <div className="p-3 rounded-xl" style={{ background: isLight ? 'rgba(60, 50, 35, 0.04)' : 'rgba(255, 255, 255, 0.06)' }}>
              <div className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: isLight ? '#3c3020' : '#fdfbf5' }}>
                Change Password
              </div>
              <input
                value={passwordDraft}
                onChange={(e) => {
                  setPasswordDraft(e.target.value);
                  if (passwordErr) setPasswordErr('');
                  if (passwordOk) setPasswordOk('');
                }}
                placeholder="New password"
                type="password"
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${isLight ? 'rgba(60, 50, 35, 0.15)' : 'rgba(255,255,255,0.12)'}`,
                  color: isLight ? '#3c3020' : '#fdfbf5',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <input
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  if (passwordErr) setPasswordErr('');
                  if (passwordOk) setPasswordOk('');
                }}
                placeholder="Confirm password"
                type="password"
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${isLight ? 'rgba(60, 50, 35, 0.15)' : 'rgba(255,255,255,0.12)'}`,
                  color: isLight ? '#3c3020' : '#fdfbf5',
                  fontFamily: 'var(--font-body)',
                }}
              />
              {passwordErr ? (
                <div className="text-xs mb-2" style={{ color: isLight ? '#8a1f11' : '#ffb4aa' }}>{passwordErr}</div>
              ) : null}
              {passwordOk ? (
                <div className="text-xs mb-2" style={{ color: isLight ? '#1c6b3a' : '#86efac' }}>{passwordOk}</div>
              ) : null}
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={
                  !canUpdatePassword ||
                  String(passwordDraft || '').length < 8 ||
                  String(passwordDraft || '') !== String(passwordConfirm || '')
                }
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  background: isLight ? 'rgba(60, 50, 35, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid rgba(60, 50, 35, 0.15)' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isLight ? '#3c3020' : '#fdfbf5',
                  fontFamily: 'var(--font-display)',
                  cursor: canUpdatePassword ? 'pointer' : 'not-allowed',
                }}
              >
                {passwordSaving ? 'Updating…' : 'Update password'}
              </button>
            </div>
            {/* PROBE:ACCOUNT_UPDATE_PASSWORD:END */}
          </div>
        ) : null}

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full px-4 py-3 rounded-lg font-bold text-sm transition-all mb-4"
          style={{
            background: isLight 
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            cursor: signingOut ? 'wait' : 'pointer',
            opacity: signingOut ? 0.7 : 1,
          }}
        >
          {signingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
        {signOutErr ? (
          <div className="text-xs mb-4" style={{ color: isLight ? '#8a1f11' : '#ffb4aa' }}>
            {signOutErr}
          </div>
        ) : null}

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
