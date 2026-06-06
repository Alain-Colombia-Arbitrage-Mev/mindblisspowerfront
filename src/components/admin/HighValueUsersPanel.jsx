/**
 * High-Value Users Quick Access Panel
 * Fast navigation to top participants and leaders
 */
import { useSimulation } from '@/lib/SimulationEngine';
import { useMemo } from 'react';
import { Eye, CreditCard, FileText, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HighValueUsersPanel() {
  const sim = useSimulation();

  const topUsers = useMemo(() => {
    const users = sim.users || [];
    const memberships = sim.integrityModel?.memberships || [];
    
    const userInvestments = {};
    memberships.forEach(m => {
      if (!userInvestments[m.user_id]) userInvestments[m.user_id] = 0;
      userInvestments[m.user_id] += m.plan_value || 0;
    });
    
    return users
      .map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        status: u.status,
        investment: userInvestments[u.id] || 0,
        country: u.country,
        email: u.email,
      }))
      .filter(u => u.investment > 0)
      .sort((a, b) => b.investment - a.investment)
      .slice(0, 5);
  }, [sim.users, sim.integrityModel]);

  return (
    <div>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>USUARIOS DE ALTO VALOR — ACCESO RÁPIDO</p>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,18,40,0.5)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <tr>
              {['Nombre', 'Rol', 'Inversión', 'País', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topUsers.map((u, i) => (
              <tr key={i} style={{ borderBottom: i < topUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td className="px-4 py-2.5">
                  <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{u.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{u.email}</p>
                </td>
                <td className="px-4 py-2.5"><span style={{ color: u.role === 'leader' ? '#8b5cf6' : '#3b82f6', fontWeight: 600 }}>{u.role}</span></td>
                <td className="px-4 py-2.5" style={{ color: '#fbbf24', fontWeight: 700 }}>${u.investment.toLocaleString()}</td>
                <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{u.country}</span></td>
                <td className="px-4 py-2.5">
                  <span style={{ color: u.status === 'activo' ? '#10b981' : '#ef4444', fontSize: 10, fontWeight: 600 }}>
                    {u.status === 'activo' ? '✓ Activo' : '⚠ Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <Link to={u.role === 'leader' ? '/admin-dashboard/leaders' : '/admin-dashboard/participants'} style={{ textDecoration: 'none' }}>
                      <button className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#3b82f6' }} title="Ver detalle">
                        <Eye size={12} />
                      </button>
                    </Link>
                    <Link to="/admin-dashboard/payments" style={{ textDecoration: 'none' }}>
                      <button className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#06b6d4' }} title="Ver pagos">
                        <CreditCard size={12} />
                      </button>
                    </Link>
                    <button className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#8b5cf6' }} title="Ver documentos">
                      <FileText size={12} />
                    </button>
                    <button className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#10b981' }} title="Ver red">
                      <Network size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}