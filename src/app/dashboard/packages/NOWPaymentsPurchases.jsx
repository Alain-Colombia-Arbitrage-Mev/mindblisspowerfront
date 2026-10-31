'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { readNOWPaymentsPurchases, resumeNOWPaymentsPurchase, cancelNOWPaymentsPurchase,
  nowpaymentsPurchaseLabel, nowpaymentsPurchaseError } from '@/lib/nowpayments-purchases.mjs';
import { readNOWPaymentsReceipt } from '@/lib/nowpayments-receipt.mjs';
import { nowpaymentsMoney, nowpaymentsDate } from '@/lib/nowpayments-balances.mjs';

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

  return <section id="nowpayments-purchases" tabIndex={-1} className="executive-panel mt-5" aria-label="Historial de compras NOWPayments" aria-busy={loading || Boolean(busy)}>
    <h3 className="executive-section-title">Historial de compras NOWPayments</h3>
    <p className="mb-3 text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>Cada compra activada es una membresía independiente. Continuar el pago utiliza la misma factura, sin crear otra compra. El regreso del proveedor no prueba el pago ni la activación.</p>
    <button type="button" className="executive-button mb-3" disabled={loading || Boolean(busy)} onClick={() => void load()}>Actualizar historial</button>
    {loading && <p role="status" className="text-sm" style={{ color: 'var(--vp-muted)' }}>Consultando compras NOWPayments…</p>}
    {error && <p role="alert" className="mb-3 text-sm" style={{ color: 'var(--vp-danger)' }}>{error}</p>}
    {notice && <p role="status" className="mb-3 text-sm leading-6" style={{ color: 'var(--vp-text-soft)' }}>{notice}</p>}
    {history?.purchases.length === 0 && !error && <p className="text-sm" style={{ color: 'var(--vp-muted)' }}>No hay compras de membresías NOWPayments registradas en tu cuenta.</p>}
    {history?.purchases.length > 0 && <div className="executive-table-wrap">
      <table className="executive-table">
        <caption className="sr-only">Compras de membresías NOWPayments de tu cuenta. Fechas de Bogotá.</caption>
        <thead><tr><th scope="col">Membresía</th><th scope="col">Importe</th><th scope="col">Creación (Bogotá)</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
        <tbody>{history.purchases.map(item => <tr key={item.order_id}>
          <td>{item.package_name}<span className="mt-1 block text-xs" style={{ color: 'var(--vp-muted)' }}>Orden {item.order_id}</span></td>
          <td>{nowpaymentsMoney(item.total_usd)}</td><td>{nowpaymentsDate(item.created_at)}</td>
          <td>{nowpaymentsPurchaseLabel(item)}{item.payment_status === 'cancelled_local' && <span className="mt-1 block text-xs" style={{ color: 'var(--vp-muted)' }}>No pagues la factura anterior; un pago tardío requiere revisión.</span>}</td>
          <td><div className="flex flex-wrap gap-2">
            <button type="button" className="executive-button" disabled={Boolean(busy) || loading || Boolean(error)} onClick={() => void perform('check', item)} aria-label={`Consultar estado de ${item.package_name}, orden ${item.order_id}`}>Ver estado</button>
            {item.can_resume && <button type="button" className="executive-button primary" disabled={Boolean(busy) || loading || Boolean(error)} onClick={() => void perform('resume', item)} aria-label={`Continuar pago de ${item.package_name}, orden ${item.order_id}`}>Continuar pago</button>}
            {item.can_cancel && <button type="button" className="executive-button" disabled={Boolean(busy) || loading || Boolean(error)} onClick={event => { returnFocus.current = event.currentTarget; setCancelTarget(item); }} aria-label={`Cancelar intención de ${item.package_name}, orden ${item.order_id}`}>Cancelar intención</button>}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>}
    {history?.has_more && <p className="mt-3 text-xs" style={{ color: 'var(--vp-muted)' }}>Se muestran las últimas 100 compras. Contacta al soporte para consultar registros anteriores.</p>}
    <AlertDialog.Root open={Boolean(cancelTarget)} onOpenChange={open => { if (!open && !locked.current) setCancelTarget(null); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)' }} />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_3rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6"
          style={{ background: 'var(--vp-surface)', border: '1px solid var(--vp-border)' }}
          onEscapeKeyDown={event => { if (locked.current) event.preventDefault(); }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            if (returnFocus.current?.isConnected && !returnFocus.current.disabled) returnFocus.current.focus();
            else globalThis.document?.getElementById('nowpayments-purchases')?.focus();
          }}>
          <AlertDialog.Title className="text-xl font-semibold" style={{ color: 'var(--vp-text)' }}>¿Cancelar esta intención de compra?</AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>
            Se cancelará sólo la intención de {cancelTarget?.package_name} en el portal. La factura externa de NOWPayments no se puede borrar ni se revoca al cancelar aquí. No pagues sus enlaces antiguos. Un pago tardío requerirá revisión manual y no implica devolución automática. Si ya pagaste, no canceles: consulta el estado o contacta al soporte.
          </AlertDialog.Description>
          {notice && !busy && <p role="alert" className="mt-3 text-sm" style={{ color: 'var(--vp-danger)' }}>{notice}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <AlertDialog.Cancel asChild><button type="button" className="executive-button" disabled={Boolean(busy)}>Conservar compra</button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><button type="button" className="executive-button" disabled={Boolean(busy)} onClick={event => { event.preventDefault(); void perform('cancel', cancelTarget); }}>{busy ? 'Confirmando cancelación…' : 'Confirmar cancelación local'}</button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  </section>;
}
