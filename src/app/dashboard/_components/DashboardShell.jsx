"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import PanelHeader from "@/components/panel/PanelHeader";
import PanelSidebar from "@/components/panel/PanelSidebar";
import NavigationDrawer from "@/components/panel/NavigationDrawer";
import SupportWidget from "@/components/panel/SupportWidget";
import { memberPageFor } from "@/lib/member-navigation.mjs";
import { MemberSessionContext } from "@/lib/member-session-context";
import { browserReferralChoice, chooseBrowserReferral, pendingVerifiedReferral, readVerifiedReferral, retryVerifiedReferral } from '@/lib/referral-sync.mjs';
import "@/components/panel/panel-shell.css";

export default function DashboardShell({ authMode: _authMode, children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [member, setMember] = useState(null);
  const [referralNotice, setReferralNotice] = useState('');
  const [referralSaving, setReferralSaving] = useState(false);
  const [referralChoice, setReferralChoice] = useState(null);
  const [referralPending, setReferralPending] = useState(false);
  const referralView = useRef(null);
  const referralSubmitting = useRef(false);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  function showReferralResult(recipient, result) {
    const visit = pendingVerifiedReferral(recipient);
    const positioned = result?.ok === true && result.positioned === true && result.ref === '' && result.preferred_side === '';
    const confirmed = result?.ok === true && (positioned || (result.positioned === false && result.ref
      && (!visit || (result.ref === visit.ref && result.preferred_side === visit.preferred_side))));
    let notice = '', choice = null;
    if (!confirmed && visit) {
      notice = 'No pudimos confirmar que tu enlace de referido quedó guardado. Reintenta antes de comprar; no se ha cambiado tu posición en la red.';
    } else if (result?.ok !== true) {
      notice = 'No pudimos consultar tu enlace de referido. Puedes reintentar la comprobación; esta consulta no guarda enlaces ni cambia tu posición en la red.';
    } else if (!positioned && !result.ref) {
      choice = browserReferralChoice(recipient);
      if (choice) notice = 'Hay un enlace guardado sólo en este dispositivo, sin confirmar en el servidor. Puedes elegirlo de nuevo antes de comprar; no se guardará automáticamente ni cambiará una posición existente.';
    }
    setReferralChoice(choice);
    setReferralPending(Boolean(visit && !confirmed));
    setReferralNotice(notice);
    return Boolean(visit && !confirmed);
  }

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const view = { email: '', revision: 0, timer: null };
    referralView.current = view;
    const checkReferral = (recipient, allowRecheck = true) => {
      const revision = ++view.revision;
      void readVerifiedReferral(recipient).then(result => {
        if (cancelled || referralView.current !== view || view.email !== recipient || view.revision !== revision) return;
        const pending = showReferralResult(recipient, result);
        // A keepalive save may still belong to the previous document. One
        // bounded GET after its request window reconciles that race, not a poll.
        if (pending && allowRecheck) view.timer = setTimeout(() => {
          view.timer = null;
          if (!cancelled && referralView.current === view && view.email === recipient && view.revision === revision)
            checkReferral(recipient, false);
        }, 5000);
      });
    };
    const loadSession = () => {
      fetch("/api/auth/session", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (cancelled) return;
          if (d?.name || d?.email)
            setMember({
              name: d.name,
              email: d.email,
              subject: d.subject,
              referralCode: d.referralCode,
            });
          if (d?.authenticated === true && d?.mode === 'better-auth' && typeof d.email === 'string') {
            const recipient = d.email.trim().toLowerCase();
            view.email = recipient;
            checkReferral(recipient);
          }
        })
        .catch(() => {});
    };
    loadSession();
    // Al editar el perfil (nombre/datos) se dispara este evento con el nombre
    // nuevo → actualizamos el sidebar de INMEDIATO (optimista) y re-consultamos
    // la sesión para confirmar, sin recargar la página.
    const onProfileUpdated = (e) => {
      const newName = e?.detail?.name;
      // Solo actualización optimista con el nombre guardado. NO re-consultamos la
      // sesión aquí: el POST ya confirmó el guardado, y una re-consulta podría
      // devolver un nombre stale (lag de réplica/cache) y pisar el valor nuevo.
      // La sesión se sincroniza sola en el próximo montaje/navegación.
      if (newName) setMember((m) => ({ ...(m || {}), name: newName }));
    };
    window.addEventListener("vp:profile-updated", onProfileUpdated);
    return () => {
      cancelled = true;
      clearTimeout(view.timer);
      if (referralView.current === view) referralView.current = null;
      window.removeEventListener("vp:profile-updated", onProfileUpdated);
    };
  }, []);

  async function retryReferral() {
    const view = referralView.current;
    if (!view?.email || referralSubmitting.current) return;
    referralSubmitting.current = true;
    view.revision++;
    clearTimeout(view.timer);
    view.timer = null;
    setReferralSaving(true);
    try {
      const result = await (referralChoice ? chooseBrowserReferral(view.email, referralChoice)
        : referralPending ? retryVerifiedReferral(view.email) : readVerifiedReferral(view.email));
      if (referralView.current !== view) return;
      showReferralResult(view.email, result);
    } finally {
      referralSubmitting.current = false;
      if (referralView.current === view) setReferralSaving(false);
    }
  }

  const { title, section } = memberPageFor(pathname);
  const overview = pathname === "/dashboard" || pathname === "/dashboard/home";

  return (
    <MemberSessionContext.Provider value={member}>
      <div className="vp-dashboard-shell">
        <a className="vp-skip-link" href="#member-main">
          Ir al contenido
        </a>
        <NavigationDrawer open={mobileMenuOpen} onClose={closeMenu}>
          <PanelSidebar
            pathname={pathname}
            member={member}
            onNavigate={closeMenu}
          />
        </NavigationDrawer>
        <aside className="vp-panel-sidebar">
          <PanelSidebar pathname={pathname} member={member} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PanelHeader
            title={title}
            section={section}
            overview={overview}
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
          />
          <main
            id="member-main"
            tabIndex={-1}
            className="vp-dashboard-main flex-1 overflow-y-auto"
          >
            <div className="vp-dashboard-content">
              {referralNotice ? <div role="alert" className="vp-dashboard-notice rounded-lg border border-[var(--vp-border)] bg-[var(--vp-surface)] p-4 text-sm leading-6 text-[var(--vp-text)]">
                <p>{referralNotice}</p>
                {referralChoice ? <p className="mt-2 break-words">Cuenta: {referralChoice.email}. Referido: {referralChoice.code}. Rama: {referralChoice.side === 'L' ? 'izquierda' : referralChoice.side === 'R' ? 'derecha' : 'sin preferencia'}.</p> : null}
                <button type="button" onClick={retryReferral} disabled={referralSaving} className="executive-button mt-3 disabled:opacity-60">
                  {referralSaving ? (referralChoice || referralPending ? 'Guardando enlace…' : 'Comprobando enlace…')
                    : referralChoice ? 'Guardar este enlace como mi elección' : referralPending ? 'Reintentar guardar enlace' : 'Reintentar comprobación'}
                </button>
              </div> : null}
              {children}
            </div>
          </main>
        </div>
        <SupportWidget />
      </div>
    </MemberSessionContext.Provider>
  );
}
