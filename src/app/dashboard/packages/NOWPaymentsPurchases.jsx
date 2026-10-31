'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertCircle, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, Clock3, Info, Loader2, ShoppingBag, XCircle } from 'lucide-react';
import { readNOWPaymentsPurchases, resumeNOWPaymentsPurchase, cancelNOWPaymentsPurchase,
  nowpaymentsPurchaseLabel, nowpaymentsPurchaseError } from '@/lib/nowpayments-purchases.mjs';
import { readNOWPaymentsReceipt } from '@/lib/nowpayments-receipt.mjs';
import { nowpaymentsMoney, nowpaymentsDate } from '@/lib/nowpayments-balances.mjs';
import { cn } from '@/lib/utils';
import styles from './nowpayments-purchases.module.css';

/** Owner history is independent of recovered Stripe data and contains no new checkout. */
export default function NOWPaymentsPurchases({ onChange }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const readRequest = useRef(null), actionRequest = useRef(null), locked = useRef(false), returnFocus = useRef(null);
  const load = useCallback(async () => {
    readRequest.current?.abort();
    const controller = new AbortController(); readRequest.current = controller;
    setLoading(true); setError('');
    try {
      const value = await readNOWPaymentsPurchases({ signal: controller.signal });
      if (!controller.signal.aborted) setHistory(value);
    } catch (failure) {
      if (!controller.signal.aborted) {
        if ([401, 403].includes(failure?.status)) setHistory(null);
        setError('No pudimos actualizar el historial NOWPayments. Los registros anteriores, si aparecen, no confirman el estado actual.');
      }
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    return () => { readRequest.current?.abort(); actionRequest.current?.abort(); };
  }, [load]);

  async function perform(action, item) {
    if (locked.current || !item || !['check', 'resume', 'cancel'].includes(action)
        || (action === 'resume' && item.can_resume !== true) || (action === 'cancel' && item.can_cancel !== true)) return;
    locked.current = true; setBusy(item.order_id); setNotice('');
    const controller = new AbortController(); actionRequest.current = controller;
    try {
      if (action === 'resume') {
        const value = await resumeNOWPaymentsPurchase(item.order_id, { signal: controller.signal });
        if (!controller.signal.aborted) window.location.assign(value.url);
      } else if (action === 'cancel') {
        await cancelNOWPaymentsPurchase(item.order_id, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setCancelTarget(null);
        setNotice('Intención cancelada localmente. La factura externa no fue revocada: no pagues sus enlaces antiguos. Cualquier pago tardío requerirá revisión manual; no implica un reembolso automático.');
        await load();
      } else {
        const value = await readNOWPaymentsReceipt(item.order_id, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setNotice(value.fulfillment_status === 'activated' ? 'El servidor confirma la activación de esta membresía. No es una confirmación de rendimientos cobrados ni retiros.'
          : value.state === 'completed' ? 'Pago recibido y verificado. La membresía aún no figura activada; no vuelvas a pagar y revisa su estado o contacta al soporte.'
            : value.state === 'under_review' ? 'Esta compra está en revisión. No vuelvas a pagar; contacta al soporte.'
              : 'El servidor todavía no confirma el pago de esta compra. Puedes actualizar el historial; no crees otra factura para reanudarla.');
        await load();
        if (value.fulfillment_status === 'activated' && !controller.signal.aborted) void onChange?.();
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        if ([401, 403].includes(failure?.status)) setHistory(null);
        setNotice(nowpaymentsPurchaseError(failure?.code));
      }
    } finally {
      locked.current = false;
      if (!controller.signal.aborted) setBusy('');
    }
  }

  return <section id="nowpayments-purchases" tabIndex={-1} className={styles.panel} aria-label="Historial de compras NOWPayments" aria-busy={loading || Boolean(busy)}>
    <header className={styles.header}>
      <div className={styles.heading}>
        <div className={styles.titleRow}><h2 className={styles.title}>Mis compras</h2><span className={styles.provider}>NOWPayments</span></div>
        <p className={styles.intro}>Cada compra activada es una membresía independiente.</p>
      </div>
      <button type="button" className={cn(styles.action, styles.refresh)} disabled={loading || Boolean(busy)} onClick={() => void load()}>Actualizar historial</button>
    </header>
    <div className={styles.guidance}>
      <Info size={17} aria-hidden="true" />
      <p><strong>Evita pagos duplicados.</strong> Continuar el pago utiliza la misma factura, sin crear otra compra. El regreso del proveedor no prueba el pago ni la activación.</p>
    </div>
    {loading && <div role="status" className={styles.message}><Loader2 size={18} className={styles.spinner} aria-hidden="true" /><p>Consultando compras NOWPayments…</p></div>}
    {error && <div role="alert" className={cn(styles.message, styles.error)}><AlertCircle size={18} aria-hidden="true" /><p>{error}</p></div>}
    {notice && <div role="status" className={cn(styles.message, styles.notice)}><Info size={18} aria-hidden="true" /><p>{notice}</p></div>}
    {history?.purchases.length === 0 && !error && <div className={styles.empty}>
      <span className={styles.emptyIcon}><ShoppingBag size={23} aria-hidden="true" /></span>
      <h3>Aún no tienes compras</h3>
      <p>No hay compras de membresías NOWPayments registradas en tu cuenta.</p>
    </div>}
    {history?.purchases.length > 0 && <ul className={styles.list} role="list">
      {history.purchases.map(item => <li key={item.order_id}>
        <article className={styles.purchase} aria-label={`Compra de ${item.package_name}`}>
          <div className={styles.purchaseMain}>
            <div className={styles.plan}>
              <span className={styles.eyebrow}>Membresía</span>
              <h3 className={styles.planName}>{item.package_name}</h3>
              <p className={styles.date}><CalendarDays size={14} aria-hidden="true" /><time dateTime={item.created_at}>{nowpaymentsDate(item.created_at)} <span>(Bogotá)</span></time></p>
              <details className={styles.reference}>
                <summary>Referencia de la compra <ChevronDown size={14} aria-hidden="true" /></summary>
                <p>Orden <code>{item.order_id}</code></p>
              </details>
            </div>
            <div className={styles.payment}>
              <span className={styles.eyebrow}>Total de la compra</span>
              <strong className={styles.amount}>{nowpaymentsMoney(item.total_usd)}</strong>
              <PurchaseStatus item={item} />
            </div>
          </div>
          {item.payment_status === 'cancelled_local' && <p className={styles.cancelledNote}><Info size={14} aria-hidden="true" />No pagues la factura anterior; un pago tardío requiere revisión.</p>}
          <div className={styles.purchaseFooter}>
            <div className={styles.actions}>
              {item.can_resume && <button type="button" className={cn(styles.action, styles.primary)} disabled={Boolean(busy) || loading || Boolean(error)} onClick={() => void perform('resume', item)} aria-label={`Continuar pago de ${item.package_name}, orden ${item.order_id}`}>Continuar pago</button>}
              <button type="button" className={styles.action} disabled={Boolean(busy) || loading || Boolean(error)} onClick={() => void perform('check', item)} aria-label={`Consultar estado de ${item.package_name}, orden ${item.order_id}`}>Ver estado</button>
              {item.can_cancel && <button type="button" className={cn(styles.action, styles.tertiary)} disabled={Boolean(busy) || loading || Boolean(error)} onClick={event => { returnFocus.current = event.currentTarget; setCancelTarget(item); }} aria-label={`Cancelar intención de ${item.package_name}, orden ${item.order_id}`}>Cancelar intención</button>}
            </div>
            {busy === item.order_id && <p className={styles.busy} role="status"><Loader2 size={14} className={styles.spinner} aria-hidden="true" />Procesando tu solicitud…</p>}
          </div>
        </article>
      </li>)}
    </ul>}
    {history?.has_more && <p className={styles.more}>Se muestran las últimas 100 compras. Contacta al soporte para consultar registros anteriores.</p>}
    <AlertDialog.Root open={Boolean(cancelTarget)} onOpenChange={open => { if (!open && !locked.current) setCancelTarget(null); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content className={styles.dialog}
          onEscapeKeyDown={event => { if (locked.current) event.preventDefault(); }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            if (returnFocus.current?.isConnected && !returnFocus.current.disabled) returnFocus.current.focus();
            else globalThis.document?.getElementById('nowpayments-purchases')?.focus();
          }}>
          <span className={styles.dialogIcon}><AlertCircle size={24} aria-hidden="true" /></span>
          <AlertDialog.Title className={styles.dialogTitle}>¿Cancelar esta intención de compra?</AlertDialog.Title>
          <AlertDialog.Description className={styles.dialogDescription}>
            Se cancelará sólo la intención de {cancelTarget?.package_name} en el portal. La factura externa de NOWPayments no se puede borrar ni se revoca al cancelar aquí. No pagues sus enlaces antiguos. Un pago tardío requerirá revisión manual y no implica devolución automática. Si ya pagaste, no canceles: consulta el estado o contacta al soporte.
          </AlertDialog.Description>
          {notice && !busy && <p role="alert" className={styles.dialogError}>{notice}</p>}
          <div className={styles.dialogActions}>
            <AlertDialog.Cancel asChild><button type="button" className={styles.action} disabled={Boolean(busy)}>Conservar compra</button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><button type="button" className={cn(styles.action, styles.danger)} disabled={Boolean(busy)} onClick={event => { event.preventDefault(); void perform('cancel', cancelTarget); }}>{busy ? 'Confirmando cancelación…' : 'Confirmar cancelación local'}</button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  </section>;
}

const statusPresentation = new Map([
  ['awaiting_payment', { Icon: Clock3, tone: 'pending' }],
  ['processing', { Icon: Loader2, tone: 'processing' }],
  ['completed', { Icon: CheckCircle2, tone: 'confirmed' }],
  ['under_review', { Icon: AlertCircle, tone: 'review' }],
  ['invoice_unknown', { Icon: CircleHelp, tone: 'review' }],
  ['cancelled_local', { Icon: XCircle, tone: 'cancelled' }],
]);

function PurchaseStatus({ item }) {
  const active = item.fulfillment_status === 'activated' && item.payment_status === 'completed';
  const { Icon, tone } = active ? { Icon: CheckCircle2, tone: 'active' }
    : statusPresentation.get(item.payment_status) || { Icon: CircleHelp, tone: 'review' };
  return <span className={cn(styles.badge, styles[tone])}><Icon size={14} aria-hidden="true" /><span>{nowpaymentsPurchaseLabel(item)}</span></span>;
}
