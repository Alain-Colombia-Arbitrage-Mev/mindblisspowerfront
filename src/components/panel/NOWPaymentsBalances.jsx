import { nowpaymentsBalanceView, nowpaymentsMoney as money, nowpaymentsDate as date,
  nowpaymentsCommissionStatus, nowpaymentsMembershipStatus } from '@/lib/nowpayments-balances.mjs';

/** Reuses the portal's existing panels; no fetch, mutation or monetary sum. */
export default function NOWPaymentsBalances({ data }) {
  const view = nowpaymentsBalanceView(data);
  if (view.status !== 'operational') return <section className="executive-panel mt-5" aria-label="Membresías y comisiones NOWPayments">
    <h3 className="executive-section-title">Membresías y comisiones NOWPayments</h3>
    <p role="status" className="text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>
      No pudimos consultar el detalle operativo de NOWPayments. No se puede confirmar su saldo ni sus fechas de liberación; los datos históricos se conservan por separado.
    </p>
  </section>;
  const { commissions, membership } = view;
  const commissionItems = commissions.items.slice(0, 25);
  const membershipItems = membership.items.slice(0, 25);
  return <section className="executive-panel mt-5" aria-label="Membresías y comisiones NOWPayments">
    <h3 className="executive-section-title">Membresías y comisiones NOWPayments</h3>
    <p className="mb-4 text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>
      Las comisiones calculadas vencen un mes calendario desde su generación, no a los 30 días. Una retención por seguridad o financiación puede impedir su liberación. El vencimiento no implica un pago automático.
    </p>
    <dl className="grid gap-3 sm:grid-cols-2">
      <Balance label="Comisiones pendientes de liberación" amount={commissions.pending_usd} />
      <Balance label="Comisiones vencidas disponibles (contables)" amount={commissions.available_usd} />
      <Balance label="Comisiones retenidas por financiación" amount={commissions.funding_held_usd} />
      <Balance label="Acreditadas internamente, no pagadas al banco" amount={commissions.credited_usd} />
      <Balance label="Retiros externos NOW registrados" amount={commissions.paid_external_usd} />
      <Balance label="Capital de membresías bloqueado" amount={membership.principal_locked_usd} />
      <Balance label="Capital vencido, elegible para solicitud" amount={membership.principal_available_usd} />
      <Balance label="ROI de CD bloqueado" amount={membership.roi_locked_usd} />
      <Balance label="ROI de CD vencido (contable)" amount={membership.roi_available_usd} />
    </dl>
    <p role="status" className="mt-4 text-sm leading-6" style={{ color: 'var(--vp-muted)' }}>
      Los retiros externos de NOWPayments siguen deshabilitados. Un crédito interno no es un pago recibido y puede incluir asignaciones a jubilación. Las acreditaciones acumuladas no se suman a los estados de comisión. El capital y el ROI se muestran separados de las comisiones y del histórico Stripe; no deben sumarse como saldo retirable.
    </p>
    <p className="mt-2 text-xs leading-5" style={{ color: 'var(--vp-muted)' }}>
      El capital permanece bloqueado durante 365 días y después queda elegible para solicitud y validación. No hay reembolso anticipado ordinario, sin perjuicio de los derechos aplicables. Tampoco hay devolución ni retiro automático al vencer.
    </p>
    {membershipItems.length > 0 && <div className="executive-table-wrap mt-5">
      <table className="executive-table">
        <caption className="sr-only">Capital y ROI de tus membresías NOWPayments. Fechas de Bogotá informadas por el servidor.</caption>
        <thead><tr><th scope="col">Capital</th><th scope="col">Activación (Bogotá)</th><th scope="col">Vencimiento del bloqueo (Bogotá)</th><th scope="col">Elegibilidad</th></tr></thead>
        <tbody>{membershipItems.map((item, index) => <tr key={index}>
          <td>{money(item.principal_usd)}</td><td>{date(item.started_at)}</td><td>{date(item.lock_until)}</td><td>{nowpaymentsMembershipStatus(item.eligibility)}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {commissionItems.length > 0 && <div className="executive-table-wrap mt-5">
      <table className="executive-table">
        <caption className="sr-only">Comisiones NOWPayments, fechas de Bogotá y retenciones informadas por el servidor.</caption>
        <thead><tr><th scope="col">Comisión calculada</th><th scope="col">Generación (Bogotá)</th><th scope="col">Vencimiento (Bogotá)</th><th scope="col">Estado</th><th scope="col">Retenido por financiación</th></tr></thead>
        <tbody>{commissionItems.map((item, index) => <tr key={index}>
          <td>{money(item.amount_usd)}</td><td>{date(item.generated_at)}</td><td>{date(item.available_at)}</td><td>{nowpaymentsCommissionStatus(item.status)}</td><td>{money(item.funding_held_usd)}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {(commissions.items.length > 25 || membership.items.length > 25) && <p className="mt-2 text-xs" style={{ color: 'var(--vp-muted)' }}>Se muestran hasta 25 registros de cada detalle. Los totales son los informados por el servidor.</p>}
  </section>;
}

function Balance({ label, amount }) {
  return <div className="executive-card p-3">
    <dt className="text-xs font-semibold" style={{ color: 'var(--vp-muted)' }}>{label}</dt>
    <dd className="mt-1 text-lg font-semibold" style={{ color: 'var(--vp-text)' }}>{money(amount)}</dd>
  </div>;
}
