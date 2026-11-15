'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemberSession } from '@/lib/member-session-context';
import { memberSessionOwnerKey } from '@/lib/member-session-boundary.mjs';
import { cachedMemberReferral, clearMemberReferralCache, readMemberReferral } from '@/lib/member-referral-client.mjs';
import { subscribeMemberLogout } from '@/lib/member-logout-sync.mjs';
import { subscribeMemberSessionReplacement } from '@/lib/member-session-sync.mjs';

export default function useMemberReferral() {
  const session = useMemberSession(), owner = memberSessionOwnerKey(session);
  const [state, setState] = useState({ owner: '', data: null, busy: false, error: null });
  const live = useRef(null), request = useRef(null), mounted = useRef(false), retired = useRef(false);
  live.current = { owner, session };
  const refresh = useCallback((fresh = true) => {
    if (!mounted.current || retired.current || !owner || live.current.owner !== owner) return;
    request.current?.abort();
    const controller = request.current = new AbortController(), snapshot = live.current.session;
    const current = () => mounted.current && !retired.current && live.current.owner === owner && request.current === controller && !controller.signal.aborted;
    setState(previous => ({ owner, data: previous.owner === owner ? previous.data : cachedMemberReferral(snapshot), busy: true, error: null }));
    return readMemberReferral(snapshot, { refresh: fresh, signal: controller.signal }).then(data => {
      if (current()) setState({ owner, data, busy: false, error: null });
    }).catch(error => {
      if (current()) setState(previous => ({ owner, data: [401, 403, 409].includes(error?.status) ? null : previous.data,
        busy: false, error }));
    });
  }, [owner]);
  useEffect(() => {
    mounted.current = true; retired.current = false;
    void refresh(false);
    const retire = () => { retired.current = true; request.current?.abort(); clearMemberReferralCache();
      if (mounted.current) setState({ owner: '', data: null, busy: false, error: null }); };
    const logout = subscribeMemberLogout(retire), replacement = subscribeMemberSessionReplacement(retire);
    return () => { mounted.current = false; request.current?.abort(); logout(); replacement(); };
  }, [owner, refresh]);
  const data = !retired.current && state.owner === owner ? state.data : null;
  const canShare = useCallback(() => mounted.current && !retired.current && Boolean(owner) && live.current.owner === owner, [owner]);
  return { data, error: !retired.current && state.owner === owner ? state.error : null,
    busy: !retired.current && state.owner === owner && state.busy, refresh, canShare };
}
