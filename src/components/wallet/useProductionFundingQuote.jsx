'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { quoteProductionFunding } from '@/lib/wallet-production-funding-client.mjs';
import { productionFundingSelectionKey, PRODUCTION_QUOTE_DEBOUNCE_MS, PRODUCTION_QUOTE_TTL_MS } from '@/lib/production-funding-selection.mjs';

/** One estimate per stable owned selection. Only retry() can repeat a failure. */
export default function useProductionFundingQuote({ ownerSubject, address, input, asset, valid, ready, blocked, canRun, failureKey }) {
  const key = valid && ready ? productionFundingSelectionKey(ownerSubject, address, input, asset) : '';
  const [state, setState] = useState({ key: '', quote: null, loading: false, error: '' });
  const [revision, setRevision] = useState(0);
  const mounted = useRef(false), epoch = useRef(0), pending = useRef(null), cache = useRef(new Map()), live = useRef(null);
  live.current = { key, address, input, canRun, failureKey };
  const store = useCallback((selection, result) => {
    cache.current.set(selection, result);
    while (cache.current.size > 32) cache.current.delete(cache.current.keys().next().value);
  }, []);
  const cancel = useCallback(() => {
    epoch.current++; const operation = pending.current;
    if (operation) { clearTimeout(operation.timer); operation.controller.abort(); pending.current = null;
      if (cache.current.get(operation.key)?.pending) store(operation.key, { error: 'unavailable' }); }
  }, [store]);
  const invalidate = useCallback(() => {
    live.current.key = ''; cancel(); if (mounted.current) setState({ key: '', quote: null, loading: false, error: '' });
  }, [cancel]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancel(); cache.current.clear(); }; }, [cancel]);
  useEffect(() => {
    if (!key) { setState({ key: '', quote: null, loading: false, error: '' }); return undefined; }
    if (blocked) return undefined;
    const cached = cache.current.get(key);
    if (cached && !cached.pending) {
      const fresh = cached.quote && Date.now() - cached.quote.receivedAt < PRODUCTION_QUOTE_TTL_MS;
      setState({ key, quote: fresh ? cached.quote : null, loading: false, error: fresh ? '' : cached.error || 'quoteExpired' });
      return undefined;
    }
    const controller = new AbortController(), generation = ++epoch.current;
    const current = () => mounted.current && epoch.current === generation && live.current.key === key && !controller.signal.aborted && live.current.canRun();
    setState({ key, quote: null, loading: true, error: '' });
    const operation = { key, controller, timer: undefined };
    operation.timer = setTimeout(async () => {
      if (!current()) return;
      store(key, { pending: true });
      try {
        const quote = await quoteProductionFunding(live.current.input, live.current.address, { ownerSubject, signal: controller.signal });
        if (!current()) return;
        const result = { ...quote, receivedAt: Date.now() }; store(key, { quote: result });
        setState({ key, quote: result, loading: false, error: '' });
      } catch (failure) {
        if (!current()) return;
        const error = live.current.failureKey(failure); store(key, { error }); setState({ key, quote: null, loading: false, error });
      } finally { if (pending.current === operation) pending.current = null; }
    }, PRODUCTION_QUOTE_DEBOUNCE_MS);
    pending.current = operation;
    return cancel;
  }, [key, ownerSubject, blocked, revision, cancel, store]);
  useEffect(() => {
    if (!state.quote || state.key !== key) return undefined;
    const remaining = state.quote.receivedAt + PRODUCTION_QUOTE_TTL_MS - Date.now();
    const timer = setTimeout(() => { if (mounted.current && live.current.key === key) setState({ key, quote: null, loading: false, error: 'quoteExpired' }); }, Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [key, state.quote, state.key]);
  const retry = useCallback(() => {
    if (!mounted.current || !live.current.key || !live.current.canRun()) return;
    cancel(); cache.current.delete(live.current.key); setRevision(value => value + 1);
  }, [cancel]);
  const expire = useCallback(() => {
    if (!mounted.current || !live.current.key) return;
    cancel(); store(live.current.key, { error: 'quoteExpired' });
    setState({ key: live.current.key, quote: null, loading: false, error: 'quoteExpired' });
  }, [cancel, store]);
  return { quote: state.key === key ? state.quote : null, loading: state.key === key && state.loading,
    error: state.key === key ? state.error : '', invalidate, retry, expire };
}
