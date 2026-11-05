import { Info, LockKeyhole, Wallet } from 'lucide-react';
import { nowpaymentsBalanceView, nowpaymentsMoney as money, nowpaymentsDate as date,
  nowpaymentsCommissionStatus, nowpaymentsMembershipStatus } from '@/lib/nowpayments-balances.mjs';
import styles from './nowpayments-balances.module.css';
import { compensationOriginLabel } from '@/lib/compensation-origin.mjs';

// Presentation only: never infer payment, PV, commission, maturity or eligibility
// from browser state. Manual records are not provider receipts or NOW invoices.
export default function ManualMembershipBalances({ data }) {
  if (!data) return null;
  const view = nowpaymentsBalanceView(data);
  const factsValid = view.status === 'operational' && view.membership.items.every(item =>
    ['gross_usd', 'fee_usd', 'net_usd'].every(key => typeof item[key] === 'string' && /^(0|[1-9]\d{0,23})(?:\.\d{1,4})?$/.test(item[key]))
    && typeof item.pv === 'string' && /^\d{1,15}$/.test(item.pv));
  if (data.provider !== 'manual' || !factsValid) return <section className={styles.section} aria-label="Membresías registradas manualmente">
    <Heading />
    <div className={styles.notice} role="status"><Info size={19} aria-hidden="true" /><p>No pudimos consultar tus registros manuales. Sus importes y fechas no están disponibles; los demás registros se conservan por separado.</p></div>
  </section>;
  const { membership, commissions } = view;
  if (membership.items.length === 0 && commissions.items.length === 0) return null;
  return <section className={styles.section} aria-label="Membresías registradas manualmente">
    <Heading />
    <div className={styles.groups}>
      <Group title="Capital" period="365 días"><Amount label="Capital bloqueado" value={membership.principal_locked_usd} /><Amount label="Capital vencido, elegible para solicitud" value={membership.principal_available_usd} /></Group>
      <Group title="Comisiones" period="1 mes calendario"><Amount label="Pendientes de liberación" value={commissions.pending_usd} /><Amount label="Vencidas disponibles (contables)" value={commissions.available_usd} /><Amount label="Retenidas por financiación" value={commissions.funding_held_usd} /></Group>
      <Group title="ROI" period="Plazo del CD"><Amount label="ROI bloqueado" value={membership.roi_locked_usd} /><Amount label="ROI vencido (contable)" value={membership.roi_available_usd} /></Group>
    </div>
    <div className={styles.notice} role="status"><LockKeyhole size={19} aria-hidden="true" /><p>Registro manual aprobado, separado de Stripe y NOWPayments. Las comisiones vencen un mes calendario desde su generación. El capital y el ROI permanecen bloqueados 365 días; no hay retiro ni devolución automáticos. Los retiros externos siguen deshabilitados.</p></div>
    {membership.items.length > 0 && <div className={styles.detail}><h4>Detalle del pago manual</h4><div className={styles.tableWrap}><table className={styles.table}>
      <caption className="sr-only">Importes, PV y fechas de tus pagos manuales informados por el servidor.</caption>
      <thead><tr><th scope="col">Capital</th><th scope="col">Deducción</th><th scope="col">Base de comisiones</th><th scope="col">PV</th><th scope="col">Activación (Bogotá)</th><th scope="col">Fin del bloqueo (Bogotá)</th><th scope="col">Estado</th></tr></thead>
      <tbody>{membership.items.slice(0, 25).map((item, index) => <tr key={index}><td data-label="Capital">{money(item.principal_usd)}</td><td data-label="Deducción">{money(item.fee_usd)}</td><td data-label="Base de comisiones">{money(item.net_usd)}</td><td data-label="PV">{typeof item.pv === 'string' && /^\d+$/.test(item.pv) ? item.pv : 'No disponible'}</td><td data-label="Activación (Bogotá)">{date(item.started_at)}</td><td data-label="Fin del bloqueo (Bogotá)">{date(item.lock_until)}</td><td data-label="Estado">{nowpaymentsMembershipStatus(item.eligibility)}</td></tr>)}</tbody>
    </table></div></div>}
    {commissions.items.length > 0 && <div className={styles.detail}><h4>Comisiones de tus membresías manuales</h4><div className={styles.tableWrap}><table className={styles.table}>
      <caption className="sr-only">Comisiones y retenciones contables de las membresías manuales.</caption>
      <thead><tr><th scope="col">Calculada</th><th scope="col">Origen de la venta</th><th scope="col">Generada (Bogotá)</th><th scope="col">Vencimiento (Bogotá)</th><th scope="col">Estado</th></tr></thead>
      <tbody>{commissions.items.slice(0, 25).map((item, index) => <tr key={index}><td data-label="Calculada">{money(item.amount_usd)}</td><td data-label="Origen de la venta">{compensationOriginLabel(item.source_provider)}</td><td data-label="Generada (Bogotá)">{date(item.generated_at)}</td><td data-label="Vencimiento (Bogotá)">{date(item.available_at)}</td><td data-label="Estado">{nowpaymentsCommissionStatus(item.status)}</td></tr>)}</tbody>
    </table></div></div>}
  </section>;
}
function Heading() { return <div className={styles.heading}><div><span className={styles.eyebrow}>Tu actividad</span><h3>Membresías registradas manualmente</h3><p>Capital, ROI y comisiones con sus propios plazos.</p></div><span className={styles.provider}>Registro manual</span></div>; }
function Group({ title, period, children }) { return <div className={styles.group}><div className={styles.groupHeading}><Wallet size={19} aria-hidden="true" /><h4>{title}</h4></div><span className={styles.period}>{period}</span><dl>{children}</dl></div>; }
function Amount({ label, value }) { return <div className={styles.balance}><dt>{label}</dt><dd>{money(value)}</dd></div>; }
