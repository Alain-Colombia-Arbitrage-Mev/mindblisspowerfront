import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Filter, LogIn, Edit2, Shield, CreditCard, AlertCircle, Users, Settings, Zap, Eye, RefreshCw } from 'lucide-react';

const TYPE_CFG = {
  access: { color: '#3b82f6', label: 'Access', icon: LogIn },
  edit: { color: '#8b5cf6', label: 'Edit', icon: Edit2 },
  role: { color: '#06b6d4', label: 'Role Change', icon: Shield },
  payment: { color: '#10b981', label: 'Payment', icon: CreditCard },
  security: { color: '#ef4444', label: 'Security', icon: AlertCircle },
  participant: { color: '#fb923c', label: 'Participant', icon: Users },
  system: { color: '#6b7280', label: 'System', icon: Settings },
  growth: { color: '#a855f7', label: 'Growth', icon: Zap },
};

const SEVERITY_CFG = {
  info: { color: '#3b82f6', label: 'Info' },
  warning: { color: '#fb923c', label: 'Warning' },
  critical: { color: '#ef4444', label: 'Critical' },
  success: { color: '#10b981', label: 'Success' },
};

const LOGS = [
  { id: 'AUD-10291', action: 'Admin Login', actor: 'J. Smith', actorRole: 'Operations Admin', target: 'Platform', type: 'access', severity: 'info', ip: '185.44.21.10', country: 'US', timestamp: '2026-04-13 14:32:18', details: 'Successful admin login from verified IP.', session: 'SES-88412' },
  { id: 'AUD-10292', action: 'Payment FLAGGED — AML', actor: 'S. Johnson', actorRole: 'Compliance Officer', target: 'TXN-88404 · Luisa Fernández', type: 'security', severity: 'critical', ip: '92.14.33.8', country: 'UK', timestamp: '2026-04-13 13:55:42', details: 'Transaction flagged by AML engine. Origin mismatch with KYC profile. Third-party funding suspected.', session: 'SES-88410' },
  { id: 'AUD-10293', action: 'Participant BLOCKED', actor: 'J. Smith', actorRole: 'Operations Admin', target: 'P-20486 · Andrés Torres', type: 'security', severity: 'critical', ip: '185.44.21.10', country: 'US', timestamp: '2026-04-13 13:22:09', details: 'Account blocked following duplicate registration detection. AML report submitted.', session: 'SES-88412' },
  { id: 'AUD-10294', action: 'Investment APPROVED', actor: 'M. Lee', actorRole: 'Finance Reviewer', target: 'INV-5501 · Juan García', type: 'payment', severity: 'success', ip: '104.22.19.5', country: 'SG', timestamp: '2026-04-13 12:44:31', details: 'Investment $750 approved after manual review. Card payment verified.', session: 'SES-88408' },
  { id: 'AUD-10295', action: 'Leader SUSPENDED', actor: 'A. Reyes', actorRole: 'Operations Admin', target: 'L-007 · Marco Bianchi', type: 'participant', severity: 'critical', ip: '78.14.112.33', country: 'DE', timestamp: '2026-04-13 11:18:55', details: 'Leader suspended after 7 communication violations. Unauthorized income claims promoted in EU WhatsApp groups. Legal notified.', session: 'SES-88405' },
  { id: 'AUD-10296', action: 'Role ASSIGNED', actor: 'J. Smith', actorRole: 'Super Admin', target: 'K. Torres → Finance Reviewer', type: 'role', severity: 'warning', ip: '185.44.21.10', country: 'US', timestamp: '2026-04-13 10:30:14', details: 'User K. Torres assigned to Finance Reviewer role. 35 permissions granted.', session: 'SES-88412' },
  { id: 'AUD-10297', action: 'Case ESCALATED', actor: 'System', actorRole: 'Automated SLA Engine', target: 'CS-4821 — Juan García', type: 'system', severity: 'warning', ip: 'SYSTEM', country: '—', timestamp: '2026-04-13 08:00:00', details: 'Support case auto-escalated — SLA breach detected after 72h without resolution.', session: 'AUTO' },
  { id: 'AUD-10298', action: 'KYC VERIFIED', actor: 'M. Lee', actorRole: 'Finance Reviewer', target: 'P-20487 · Sofia Lima', type: 'edit', severity: 'success', ip: '104.22.19.5', country: 'SG', timestamp: '2026-04-12 17:20:11', details: 'KYC document verified. ID confirmed. Status updated to verified.', session: 'SES-88402' },
  { id: 'AUD-10299', action: 'Permission MODIFIED', actor: 'J. Smith', actorRole: 'Super Admin', target: 'Role: Marketing Operator', type: 'role', severity: 'warning', ip: '185.44.21.10', country: 'US', timestamp: '2026-04-12 16:44:09', details: 'Access_command_center permission added to Marketing Operator role.', session: 'SES-88400' },
  { id: 'AUD-10300', action: 'Payment REVERSED', actor: 'K. Torres', actorRole: 'Finance Reviewer', target: 'TXN-88409 · Roberto Gómez', type: 'payment', severity: 'warning', ip: '212.10.55.3', country: 'MX', timestamp: '2026-04-12 15:10:04', details: 'Transaction reversed — transfer amount dispute. $1,500 reversal processed.', session: 'SES-88396' },
  { id: 'AUD-10301', action: 'Growth Campaign LAUNCHED', actor: 'A. Reyes', actorRole: 'Marketing Operator', target: 'Campaign: Q2-LATAM-2026', type: 'growth', severity: 'info', ip: '78.14.112.33', country: 'DE', timestamp: '2026-04-12 14:00:00', details: 'New LATAM growth campaign launched. Targets: MX, CO, BR. Duration: 30 days.', session: 'SES-88394' },
  { id: 'AUD-10302', action: 'System Settings UPDATED', actor: 'J. Smith', actorRole: 'Super Admin', target: 'Platform Config', type: 'system', severity: 'warning', ip: '185.44.21.10', country: 'US', timestamp: '2026-04-12 11:22:33', details: 'Auto-approval threshold changed from $300 to $500. AML risk threshold updated to 70.', session: 'SES-88388' },
  { id: 'AUD-10303', action: 'Payout REQUEST APPROVED', actor: 'M. Lee', actorRole: 'Finance Reviewer', target: 'PWD-441 · Carlos López', type: 'payment', severity: 'success', ip: '104.22.19.5', country: 'SG', timestamp: '2026-04-12 10:14:22', details: 'Leader payout $3,420 approved. Cycle earnings verified. Transfer initiated.', session: 'SES-88385' },
  { id: 'AUD-10304', action: 'Bulk Export', actor: 'J. Smith', actorRole: 'Operations Admin', target: 'CRM — 2,847 records', type: 'access', severity: 'warning', ip: '185.44.21.10', country: 'US', timestamp: '2026-04-11 09:05:55', details: 'Full CRM export initiated. 2,847 records exported as CSV. Reason: Quarterly audit.', session: 'SES-88372' },
];

export default function Audit() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => LOGS.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || l.action.toLowerCase().includes(q) || l.actor.toLowerCase().includes(q) || l.target.toLowerCase().includes(q) || l.id.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || l.type === typeFilter;
    const matchSeverity = severityFilter === 'all' || l.severity === severityFilter;
    return matchQ && matchType && matchSeverity;
  }), [search, typeFilter, severityFilter]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>AUDIT · COMPLIANCE TRAIL</p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Global Audit Log</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Immutable activity trail · All admin actions · Security events · Role changes · Financial decisions</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
          <Download size={13} /> Export Audit
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Events', value: LOGS.length, color: '#3b82f6' },
          { label: 'Critical Events', value: LOGS.filter(l=>l.severity==='critical').length, color: '#ef4444' },
          { label: 'Security Events', value: LOGS.filter(l=>l.type==='security').length, color: '#fb923c' },
          { label: 'Payment Events', value: LOGS.filter(l=>l.type==='payment').length, color: '#10b981' },
          { label: 'Role Changes', value: LOGS.filter(l=>l.type==='role').length, color: '#06b6d4' },
        ].map((kpi, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}25` }}>
            <p style={{ color: kpi.color, fontSize: 22, fontWeight: 900, margin: '0 0 2px 0' }}>{kpi.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: 0 }}>{kpi.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-56 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search event, actor, target, ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>All Types</option>
          {Object.entries(TYPE_CFG).map(([t, cfg]) => <option key={t} value={t} style={{ background: '#0d1f3c' }}>{cfg.label}</option>)}
        </select>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>All Severity</option>
          {Object.entries(SEVERITY_CFG).map(([s, cfg]) => <option key={s} value={s} style={{ background: '#0d1f3c' }}>{cfg.label}</option>)}
        </select>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, alignSelf: 'center' }}>{filtered.length} events</span>
      </motion.div>

      {/* Log Feed */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,31,60,0.5)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <tr>
              {['Event ID', 'Action', 'Actor', 'Target', 'Type', 'Severity', 'IP / Country', 'Timestamp', 'Detail'].map(h => (
                <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
              const tCfg = TYPE_CFG[log.type];
              const sCfg = SEVERITY_CFG[log.severity];
              const Icon = tCfg.icon;
              const isSelected = selected?.id === log.id;
              return (
                <tr key={i} onClick={() => setSelected(isSelected ? null : log)}
                  className="cursor-pointer hover:bg-white/5 transition-all"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? `${tCfg.color}08` : log.severity === 'critical' ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                  <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 10 }}>{log.id}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded" style={{ background: `${tCfg.color}20` }}>
                        <Icon size={11} style={{ color: tCfg.color }} />
                      </div>
                      <span style={{ color: 'white', fontWeight: 600 }}>{log.action}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, margin: 0 }}>{log.actor}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: 10 }}>{log.actorRole}</p>
                  </td>
                  <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.target}</td>
                  <td className="px-3 py-3">
                    <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${tCfg.color}15`, color: tCfg.color }}>{tCfg.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${sCfg.color}15`, color: sCfg.color, border: `1px solid ${sCfg.color}25` }}>{sCfg.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: 'monospace', fontSize: 10 }}>{log.ip}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontSize: 10 }}>{log.country}</p>
                  </td>
                  <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 10 }}>{log.timestamp}</td>
                  <td className="px-3 py-3">
                    <button className="p-1.5 rounded hover:bg-white/10" style={{ color: '#3b82f6' }}><Eye size={12} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Expanded Detail */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl" style={{ background: `${TYPE_CFG[selected.type].color}08`, border: `1px solid ${TYPE_CFG[selected.type].color}30` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>{selected.id} · {selected.timestamp}</span>
              <p style={{ color: 'white', fontSize: 14, fontWeight: 800, margin: '4px 0 0 0' }}>{selected.action}</p>
            </div>
            <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.4)' }}>✕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
            {[
              { l: 'ACTOR', v: `${selected.actor} (${selected.actorRole})` },
              { l: 'TARGET', v: selected.target },
              { l: 'IP ADDRESS', v: selected.ip },
              { l: 'SESSION', v: selected.session },
            ].map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: '0 0 3px 0' }}>{f.l}</p>
                <p style={{ color: 'white', fontWeight: 600, margin: 0, wordBreak: 'break-all' }}>{f.v}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>FULL EVENT DETAILS</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>{selected.details}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}