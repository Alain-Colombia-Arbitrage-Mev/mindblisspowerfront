"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createHeadlessPaymentConnection } from "@/lib/reown-headless-payment.mjs";

/** React bridge around the owner-scoped headless activation state machine.
 * SDK services are injected by the existing singleton provider. */
export function useHeadlessPaymentConnection({ read, services }) {
  const latest = useRef({ read, services }); latest.current = { read, services };
  const mounted = useRef(true);
  const [state, setState] = useState({ owner: "", generation: -1, phase: "idle", error: "", email: "", resendAt: 0 });
  const controller = useRef(null);
  if (!controller.current) {
    controller.current = createHeadlessPaymentConnection({
      read: () => latest.current.read(), onState: state => {
        const snapshot = latest.current.read();
        if (!mounted.current || !snapshot?.live) return;
        setState({ owner: snapshot?.owner || "", generation: snapshot?.generation ?? -1, ...state });
      },
      reset: scope => latest.current.services.reset(scope),
      restore: (scope, expected) => latest.current.services.restore?.(scope, expected) ?? Promise.resolve(false),
      requestEmail: (email, scope) => latest.current.services.requestEmail(email, scope),
      verifyEmail: (otp, scope) => latest.current.services.verifyEmail(otp, scope),
      confirmDevice: scope => latest.current.services.confirmDevice(scope),
      connectSocial: (social, scope) => latest.current.services.connectSocial(social, scope),
      connectExternal: (id, scope) => latest.current.services.connectExternal(id, scope),
      markCandidate: snapshot => latest.current.services.markCandidate(snapshot),
      link: scope => latest.current.services.link(scope),
      openNative: scope => latest.current.services.openNative(scope),
      fetchWallets: () => latest.current.services.fetchWallets(),
      cleanup: () => latest.current.services.cleanup(),
    });
  }
  const snapshot = read(), owner = snapshot?.owner || "", generation = snapshot?.generation ?? -1;
  const guard = useCallback(() => {
    const current = latest.current.read();
    if (!mounted.current || !current?.live || current.owner !== owner || current.generation !== generation) throw new DOMException("Aborted", "AbortError");
  }, [owner, generation]);
  const connect = useCallback(options => { try { guard(); } catch (error) { return Promise.reject(error); } return controller.current.start(false, options); }, [guard]);
  const prepare = useCallback(options => { try { guard(); } catch (error) { return Promise.reject(error); } return controller.current.start(true, options); }, [guard]);
  const cancel = useCallback(() => { try { guard(); } catch { return; } controller.current.cancel(); }, [guard]);
  const stop = useCallback(() => controller.current.cancel(), []);
  useEffect(() => { controller.current.update(); });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current.cancel(); }; }, []);
  const ownState = state.owner === snapshot?.owner && state.generation === snapshot?.generation
    ? state : { phase: "idle", error: "", email: "", resendAt: 0 };
  return { state: ownState, connect, prepare, cancel, stop,
    requestEmail: email => { guard(); return controller.current.requestEmail(email); },
    verifyEmail: otp => { guard(); return controller.current.verifyEmail(otp); },
    confirmDevice: () => { guard(); return controller.current.confirmDevice(); },
    connectSocial: social => { guard(); return controller.current.connectSocial(social); },
    connectExternal: id => { guard(); return controller.current.connectExternal(id); },
    openNative: () => { guard(); return controller.current.openNative(); },
  };
}
