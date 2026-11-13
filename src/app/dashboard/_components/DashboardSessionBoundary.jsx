'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { subscribeMemberLogout } from '@/lib/member-logout-sync.mjs';
import { checkMemberSessionOwner, memberSessionOwnerKey } from '@/lib/member-session-boundary.mjs';
import { useI18n } from '@/i18n/LanguageProvider';

export default function DashboardSessionBoundary({ owner, mode = 'better-auth', children }) {
  const { t } = useI18n();
  const initialOwner = useRef(owner), initialKey = useRef(memberSessionOwnerKey(owner));
  const [state, setState] = useState('active');
  const control = useRef({ mounted: false, closed: false, leaving: false, generation: 0, request: null });
  const changed = !initialKey.current || memberSessionOwnerKey(owner) !== initialKey.current;

  const block = next => flushSync(() => setState(next));
  const cancel = () => { control.current.generation++; control.current.request?.abort(); control.current.request = null; };
  const leave = () => {
    const current = control.current;
    if (current.leaving) return;
    current.leaving = true;
    try { window.location.replace('/login'); } catch { /* The blocked view retains a normal login link. */ }
  };
  const retire = ({ local = false } = {}) => {
    if (!control.current.mounted || control.current.closed) return;
    control.current.closed = true; cancel(); block('signed-out');
    // The initiating logout helper owns its one hard navigation. Other tabs
    // and a failed restored-session proof must leave this document themselves.
    if (!local) leave();
  };
  const recheck = async () => {
    const current = control.current;
    if (!current.mounted || current.closed || current.request) return;
    const request = new AbortController(), generation = ++current.generation;
    current.request = request; block('checking');
    const result = await checkMemberSessionOwner(initialOwner.current, { mode, signal: request.signal });
    if (!current.mounted || current.closed || request.signal.aborted || current.generation !== generation) return;
    current.request = null;
    if (result === 'same-owner') setState('active');
    else if (result === 'signed-out' || result === 'changed-owner') retire();
    else setState('unavailable');
  };

  useEffect(() => {
    control.current.mounted = true;
    const stop = subscribeMemberLogout(retire);
    const restored = event => { if (event.persisted) void recheck(); };
    const leaving = event => { if (event.persisted && !control.current.closed) { cancel(); block('checking'); } };
    window.addEventListener('pageshow', restored);
    window.addEventListener('pagehide', leaving);
    return () => {
      control.current.mounted = false; cancel(); stop();
      window.removeEventListener('pageshow', restored); window.removeEventListener('pagehide', leaving);
    };
    // A boundary is pinned to the server-verified identity for this document.
  }, []);
  useEffect(() => {
    if (changed && !control.current.closed) {
      control.current.closed = true; cancel(); setState('signed-out'); leave();
    }
  });

  if (state === 'active' && !changed) return children;
  return <main className="min-h-screen bg-[var(--vp-bg)] p-6 text-[var(--vp-text)]">
    <section className="mx-auto mt-16 max-w-md rounded-xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6" role="status" aria-live="polite">
      <p>{t(state === 'signed-out' ? 'session.checkedOut' : state === 'unavailable' ? 'session.checkUnavailable' : 'session.checking')}</p>
      {state === 'unavailable' ? <button type="button" className="mt-5 min-h-11 underline" onClick={() => void recheck()}>{t('session.retryCheck')}</button> : null}
      <a href="/login" className="mt-5 block min-h-11 underline">{t('session.returnToLogin')}</a>
    </section>
  </main>;
}
