'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { memberSessionOwnerKey } from '@/lib/member-session-boundary.mjs';
import { readHistoricalPackageRights } from '@/lib/historical-package-rights-client.mjs';
import { subscribeMemberLogout } from '@/lib/member-logout-sync.mjs';
import { subscribeMemberSessionReplacement } from '@/lib/member-session-sync.mjs';

/** Revocable access metadata is never persisted or merged into economic state. */
export default function useHistoricalPackageRights(session, enabled = true) {
  const owner = enabled ? memberSessionOwnerKey(session) : '';
  const [state, setState] = useState({ owner: '', data: null, loading: false, error: '' });
  const live = useRef(null), request = useRef(null), mounted = useRef(false), retired = useRef(false);
  live.current = { owner, subject: session?.subject };
  const refresh = useCallback(() => {
    if (!mounted.current || retired.current || !owner || live.current.owner !== owner || request.current) return;
    const controller = request.current = new AbortController(), subject = live.current.subject;
    const current = () => mounted.current && !retired.current && live.current.owner === owner && request.current === controller && !controller.signal.aborted;
    setState({ owner, data: null, loading: true, error: '' });
    return readHistoricalPackageRights(subject, { signal: controller.signal }).then(data => {
      if (current()) setState({ owner, data, loading: false, error: '' });
    }).catch(error => {
      if (!current()) return;
      if ([401, 403, 409].includes(error?.status)) retired.current = true;
      setState({ owner, data: null, loading: false, error: error?.message === 'member_package_rights_unconfigured' ? 'unconfigured' : 'unavailable' });
    }).finally(() => { if (request.current === controller) request.current = null; });
  }, [owner]);
  useEffect(() => {
    mounted.current = true; retired.current = false;
    void refresh();
    const retire = () => { retired.current = true; request.current?.abort();
      if (mounted.current) setState({ owner, data: null, loading: false, error: 'unavailable' }); };
    const logout = subscribeMemberLogout(retire), replacement = subscribeMemberSessionReplacement(retire);
    return () => { mounted.current = false; request.current?.abort(); request.current = null; logout(); replacement(); };
  }, [owner, refresh]);
  const current = state.owner === owner;
  return { data: current && !retired.current ? state.data : null, loading: Boolean(owner) && (!current || state.loading),
    error: current ? state.error : '', visible: Boolean(owner) && state.error !== 'unconfigured',
    canRefresh: Boolean(owner) && !retired.current && !state.loading, refresh };
}
