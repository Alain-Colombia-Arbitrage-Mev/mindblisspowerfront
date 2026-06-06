import unifiedDataEngine from '@/lib/UnifiedDataEngine';

/**
 * VALIDATION TABLE FOR DEBUG
 * Shows per-leader consistency metrics
 * Required to verify integration repair is complete
 */

export default function UnifiedDataValidationTable() {
  const leaders = unifiedDataEngine.integrityModel.users.filter(
    u => u.role === 'lider' || u.role === 'leader'
  );

  const rows = leaders.map(leader => {
    const profile = unifiedDataEngine.aggregationEngine.getLeaderProfile(leader.id);
    const paymentSummary = unifiedDataEngine.aggregationEngine.getPaymentSummary(leader.id);
    
    if (!profile) {
      return {
        leader_name: leader.name,
        descendant_count: 0,
        left_count: 0,
        right_count: 0,
        personal_investment: 0,
        network_investment: 0,
        monthly_income: 0,
        confirmed_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
        review_amount: 0,
        status: 'ERROR_NO_PROFILE',
      };
    }

    return {
      leader_name: leader.name,
      descendant_count: profile.total_descendants || 0,
      left_count: profile.left_count || 0,
      right_count: profile.right_count || 0,
      personal_investment: profile.personal_investment || 0,
      network_investment: profile.network_investment || 0,
      monthly_income: profile.monthly_income || 0,
      confirmed_amount: paymentSummary?.completado_amount || 0,
      pending_amount: paymentSummary?.pendiente_amount || 0,
      overdue_amount: paymentSummary?.vencido_amount || 0,
      review_amount: paymentSummary?.en_revision_amount || 0,
      status: profile.total_descendants > 0 && profile.network_investment === 0 ? 'INCONSISTENT' : 'OK',
    };
  });

  return (
    <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 overflow-x-auto">
      <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">
        Tabla de Validación Unificada
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left px-2 py-2 text-slate-300 font-bold">Líder</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Descendientes</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Izq</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Der</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Inv Personal</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Inv Red</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Ingresos</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Confirmado</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Pendiente</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Vencido</th>
            <th className="text-right px-2 py-2 text-slate-300 font-bold">Revisión</th>
            <th className="text-center px-2 py-2 text-slate-300 font-bold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="px-2 py-2 text-slate-200 font-medium">{row.leader_name}</td>
              <td className="text-right px-2 py-2 text-slate-300">{row.descendant_count}</td>
              <td className="text-right px-2 py-2 text-slate-300">{row.left_count}</td>
              <td className="text-right px-2 py-2 text-slate-300">{row.right_count}</td>
              <td className="text-right px-2 py-2 text-slate-300">${row.personal_investment.toLocaleString()}</td>
              <td className="text-right px-2 py-2 text-slate-300">${row.network_investment.toLocaleString()}</td>
              <td className="text-right px-2 py-2 text-slate-300">${row.monthly_income.toLocaleString()}</td>
              <td className="text-right px-2 py-2 text-slate-300">${row.confirmed_amount.toLocaleString()}</td>
              <td className="text-right px-2 py-2 text-slate-300">${row.pending_amount.toLocaleString()}</td>
              <td className="text-right px-2 py-2 text-red-400">${row.overdue_amount.toLocaleString()}</td>
              <td className="text-right px-2 py-2 text-yellow-400">${row.review_amount.toLocaleString()}</td>
              <td className="text-center px-2 py-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    row.status === 'OK'
                      ? 'bg-green-900/30 text-green-400'
                      : row.status === 'INCONSISTENT'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-2">
        {rows.filter(r => r.status === 'OK').length}/{rows.length} líderes consistent
      </p>
    </div>
  );
}