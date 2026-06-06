import { TrendingUp } from 'lucide-react';

export default function ValueCard() {
  const totalValue = 5000;
  const initialDeposit = 500;
  const additionalDeposits = 4500;

  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', marginBottom: 12, textTransform: 'uppercase' }}>
        Valor total de participación
      </div>

      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 48, color: 'white', marginBottom: 6, lineHeight: 1 }}>
        ${totalValue.toLocaleString()}
        <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>USD</span>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 20 }}>Total acumulado dentro del sistema</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 16, borderTop: '1px solid rgba(59,130,246,0.15)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 6, fontWeight: 700 }}>APORTE INICIAL</div>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
            ${initialDeposit.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 6, fontWeight: 700 }}>APORTES ADICIONALES</div>
          <div style={{ color: '#60a5fa', fontSize: 20, fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
            ${additionalDeposits.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 12, fontWeight: 600 }}>
        <TrendingUp size={14} />
        Tu participación está creciendo
      </div>
    </div>
  );
}