import { Wallet, Clock3, TrendingUp, Info, LockKeyhole, ChevronDown, CalendarDays } from 'lucide-react';
import { nowpaymentsBalanceView, nowpaymentsMoney as money, nowpaymentsDate as date,
  nowpaymentsCommissionStatus, nowpaymentsMembershipStatus } from '@/lib/nowpayments-balances.mjs';
import styles from './nowpayments-balances.module.css';

/** Presentation only: values, eligibility and dates always come from the server. */
export default function NOWPaymentsBalances({ data }) {
  const view = nowpaymentsBalanceView(data);
  if (view.status !== 'operational') return <section className={styles.section} aria-label="Membresías y comisiones NOWPayments">
    <SectionHeading />
    <div className={styles.notice} role="status"><Info size={19} aria-hidden="true" /><p>
      No pudimos consultar el detalle operativo de NOWPayments. No se puede confirmar su saldo ni sus fechas de liberación; los datos históricos se conservan por separado.
    </p></div>
  </section>;
  const { commissions, membership } = view;
  const commissionItems = commissions.items.slice(0, 25);
  const membershipItems = membership.items.slice(0, 25);
  return <section className={styles.section} aria-label="Membresías y comisiones NOWPayments">
    <SectionHeading />
    <div className={styles.groups}>
      <BalanceGroup Icon={Wallet} title="Capital" period="365 días" description="Cada membresía conserva su propio plazo.">
        <Balance label="Capital de membresías bloqueado" amount={membership.principal_locked_usd} primary />
        <Balance label="Capital vencido, elegible para solicitud" amount={membership.principal_available_usd} />
      </BalanceGroup>
      <BalanceGroup Icon={Clock3} title="Comisiones" period="1 mes calendario" description="Vencimiento sujeto a las retenciones vigentes.">
        <Balance label="Comisiones pendientes de liberación" amount={commissions.pending_usd} primary />
        <Balance label="Comisiones vencidas disponibles (contables)" amount={commissions.available_usd} />
        <Balance label="Comisiones retenidas por financiación" amount={commissions.funding_held_usd} />
      </BalanceGroup>
      <BalanceGroup Icon={TrendingUp} title="ROI de membresías" period="Plazo del CD" description="Separado del capital y de las comisiones.">
        <Balance label="ROI de CD bloqueado" amount={membership.roi_locked_usd} primary />
        <Balance label="ROI de CD vencido (contable)" amount={membership.roi_available_usd} />
      </BalanceGroup>
    </div>
    <div className={styles.notice} role="status"><LockKeyhole size={19} aria-hidden="true" /><div>
      <strong>Retiros externos no habilitados</strong><p>Los retiros externos de NOWPayments siguen deshabilitados. El vencimiento no implica un pago automático. El capital y el ROI se muestran separados de las comisiones y del histórico Stripe; no deben sumarse como saldo retirable.</p>
    </div></div>
    <details className={styles.conditions}>
      <summary>Cómo se liberan y registran los importes <ChevronDown size={17} aria-hidden="true" /></summary>
      <div className={styles.conditionsBody}>
        <p>Las comisiones calculadas vencen un mes calendario desde su generación, no a los 30 días. Una retención por seguridad o financiación puede impedir su liberación.</p>
        <p>Un crédito interno no es un pago recibido y puede incluir asignaciones a jubilación. Las acreditaciones acumuladas no se suman a los estados de comisión. Una fila puede estar liberada sólo parcialmente: su comisión calculada no equivale al crédito líquido ni al importe disponible.</p>
        <p>El capital permanece bloqueado durante 365 días y después queda elegible para solicitud y validación. No hay reembolso anticipado ordinario, sin perjuicio de los derechos aplicables. Tampoco hay devolución ni retiro automático al vencer.</p>
      </div>
    </details>
    <div className={styles.reconciliation}>
      <div><h4>Registro de acreditaciones</h4><p>Importes históricos de registro, no saldos adicionales.</p></div>
      <dl className={styles.reconciliationAmounts}>
        <Balance label="Acreditadas internamente, no pagadas al banco" amount={commissions.credited_usd} />
        <Balance label="Retiros externos NOW registrados" amount={commissions.paid_external_usd} />
      </dl>
    </div>
    {membershipItems.length > 0 && <div className={styles.detail}>
      <DetailHeading title="Detalle de membresías" />
      <div className={styles.tableWrap}><table className={styles.table}>
        <caption className="sr-only">Capital y ROI de tus membresías NOWPayments. Fechas de Bogotá informadas por el servidor.</caption>
        <thead><tr><th scope="col">Capital</th><th scope="col">Activación (Bogotá)</th><th scope="col">Vencimiento del bloqueo (Bogotá)</th><th scope="col">Elegibilidad</th></tr></thead>
        <tbody>{membershipItems.map((item, index) => <tr key={index}>
          <td data-label="Capital" className={styles.amount}>{money(item.principal_usd)}</td><td data-label="Activación (Bogotá)">{date(item.started_at)}</td><td data-label="Vencimiento del bloqueo (Bogotá)">{date(item.lock_until)}</td><td data-label="Elegibilidad"><span className={styles.status}>{nowpaymentsMembershipStatus(item.eligibility)}</span></td>
        </tr>)}</tbody>
      </table></div>
    </div>}
    {commissionItems.length > 0 && <div className={styles.detail}>
      <DetailHeading title="Detalle de comisiones" />
      <div className={styles.tableWrap}><table className={styles.table}>
        <caption className="sr-only">Comisiones NOWPayments, fechas de Bogotá y retenciones informadas por el servidor.</caption>
        <thead><tr><th scope="col">Comisión calculada</th><th scope="col">Crédito líquido</th><th scope="col">Generación (Bogotá)</th><th scope="col">Vencimiento (Bogotá)</th><th scope="col">Estado</th><th scope="col">Retenido por financiación</th></tr></thead>
        <tbody>{commissionItems.map((item, index) => <tr key={index}>
          <td data-label="Comisión calculada" className={styles.amount}>{money(item.amount_usd)}</td><td data-label="Crédito líquido">{money(item.liquid_credited_usd)}</td><td data-label="Generación (Bogotá)">{date(item.generated_at)}</td><td data-label="Vencimiento (Bogotá)">{date(item.available_at)}</td><td data-label="Estado"><span className={styles.status}>{nowpaymentsCommissionStatus(item.status)}</span></td><td data-label="Retenido por financiación">{money(item.funding_held_usd)}</td>
        </tr>)}</tbody>
      </table></div>
    </div>}
    {(commissions.items.length > 25 || membership.items.length > 25) && <p className={styles.footnote}>Se muestran hasta 25 registros de cada detalle. Los totales son los informados por el servidor.</p>}
  </section>;
}

function SectionHeading() {
  return <div className={styles.heading}><div><span className={styles.eyebrow}>Tu actividad</span><h3>Membresías y comisiones NOWPayments</h3><p>Consulta cada importe y su estado, sin mezclar saldos.</p></div><span className={styles.provider}>NOWPayments</span></div>;
}
function BalanceGroup({ Icon, title, period, description, children }) {
  return <div className={styles.group}><div className={styles.groupHeading}><span className={styles.icon}><Icon size={19} aria-hidden="true" /></span><h4>{title}</h4></div><span className={styles.period}>{period}</span><dl>{children}</dl><p className={styles.description}>{description}</p></div>;
}
function Balance({ label, amount, primary = false }) {
  return <div className={primary ? styles.primaryBalance : styles.balance}><dt>{label}</dt><dd>{money(amount)}</dd></div>;
}
function DetailHeading({ title }) {
  return <div className={styles.detailHeading}><h4>{title}</h4><span><CalendarDays size={14} aria-hidden="true" /> Fechas de Bogotá</span></div>;
}
