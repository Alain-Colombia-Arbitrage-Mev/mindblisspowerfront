'use client';

import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNOWPaymentsReceipt } from '@/hooks/useNOWPaymentsReceipt';
import { activatedNOWPaymentsMembership, completedNOWPaymentsReceipt } from '@/lib/nowpayments-receipt.mjs';
import { useMemberSummary } from '@/hooks/useMemberSummary';

export default function NOWPaymentsReceiptPopup({ orderId = '' }) {
  const receipt = useNOWPaymentsReceipt(orderId);
  const [dismissed, setDismissed] = useState('');
  const router = useRouter();
  const active = activatedNOWPaymentsMembership(receipt, orderId);
  const { reload } = useMemberSummary({ fresh: true });
  const refreshed = useRef('');
  useEffect(() => {
    if (!active || refreshed.current === orderId) return;
    refreshed.current = orderId;
    void reload?.();
  }, [active, orderId, reload]);
  if (dismissed === orderId || !completedNOWPaymentsReceipt(receipt, orderId)) return null;
  function close() { setDismissed(orderId); router.replace('/dashboard/packages', { scroll: false }); }
  return (
    <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[18px] p-6 text-center shadow-2xl sm:p-8"
          style={{ background: 'var(--vp-surface)', border: '1px solid var(--vp-action-border)', overscrollBehavior: 'contain' }}
          onCloseAutoFocus={event => { event.preventDefault(); document.getElementById('memberships-title')?.focus(); }}>
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" aria-hidden="true"
            style={{ background: 'var(--vp-action-muted)', border: '1px solid var(--vp-action-border)' }}>
            <CheckCircle2 size={30} style={{ color: 'var(--vp-accent)' }} />
          </span>
          <Dialog.Title className="m-0 text-2xl font-bold" style={{ color: 'var(--vp-text)' }}>{active ? 'Membresía activada' : 'Pago recibido y verificado'}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>
            {active
              ? 'Confirmamos tu pago con NOWPayments y la activación de esta membresía en el servidor. Los rendimientos y las comisiones se calculan según las reglas aplicables; no son un saldo cobrado ni un retiro confirmado.'
              : receipt.fulfillment_status === 'awaiting_payment'
                ? 'Confirmamos tu pago con NOWPayments y guardamos su comprobante. La activación de tu membresía está en proceso; no vuelvas a pagar. Si sigue pendiente, revisa Mis pagos o contacta al soporte.'
                : receipt.fulfillment_status === 'review_required'
                  ? 'Confirmamos tu pago con NOWPayments y guardamos su comprobante. Esta compra anterior requiere revisión antes de activar la membresía. No vuelvas a pagar; contacta al soporte.'
                  : 'Confirmamos tu pago con NOWPayments y guardamos su comprobante. Esta confirmación no activa una membresía ni genera rendimientos, comisiones o retiros.'}
          </Dialog.Description>
          <Dialog.Close asChild><button type="button" className="executive-button primary mt-6 w-full justify-center">Cerrar confirmación</button></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
