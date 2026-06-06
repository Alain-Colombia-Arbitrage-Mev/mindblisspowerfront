import { useState } from 'react';
import { Trophy, TrendingUp, Globe, Users, Crown, Star } from 'lucide-react';
import { useStatus } from '@/hooks/useStatus';

const mockGlobal = [
  { pos: 1, name: 'Carlos M.', country: '🇲🇽', level: 38, progress: 94 },
  { pos: 2, name: 'Lucía R.', country: '🇨🇴', level: 35, progress: 90 },
  { pos: 3, name: 'Andrés V.', country: '🇵🇪', level: 33, progress: 86 },
  { pos: 4, name: 'Mariela F.', country: '🇦🇷', level: 31, progress: 82 },
  { pos: 5, name: 'Diego S.', country: '🇨🇱', level: 29, progress: 79 },
  { pos: 6, name: 'Valentina T.', country: '🇻🇪', level: 27, progress: 74 },
  { pos: 7, name: 'Roberto A.', country: '🇺🇾', level: 25, progress: 70 },
  { pos: 8, name: 'Camila O.', country: '🇪🇨', level: 23, progress: 66 },
  { pos: 9, name: 'Héctor L.', country: '🇧🇴', level: 21, progress: 61 },
  { pos: 10, name: 'Patricia N.', country: '🇵🇦', level: 19, progress: 57 },
  { pos: 142, name: 'Tú', country: '—', level: 7, progress: 32, isMe: true },
];

const mockCountry = mockGlobal.slice(0, 5).map((m, i) => ({ ...m, pos: i + 1, country: '🇲🇽' }));
const mockTeam = [
  { pos: 1, name: 'Tú', level: 7, progress: 32, isMe: true },
  { pos: 2, name: 'Miguel P.', level: 5, progress: 24 },
  { pos: 3, name: 'Sandra K.', level: 3, progress: 15 },
];

const tabs = [
  { id: 'global', label: 'Ranking global', icon: Globe },
  { id: 'country', label: 'Por país', icon: TrendingUp },
  { id: 'team', label: 'Por equipo', icon: Users },
];

const posColor = (pos) => {
  if (pos === 1) return '#f59e0b';
  if (pos === 2) return '#9ca3af';
  if (pos === 3) return '#b45309';
  return 'rgba(255,255,255,0.3)';
};

export default function DashRanking() {
  const [tab, setTab] = useState('global');
  const data = tab === 'global' ? mockGlobal : tab === 'country' ? mockCountry : mockTeam;
  const myEntry = mockGlobal.find(m => m.isMe);
  const mockUserData = {
    accountAgeInDays: 45,
    emailVerified: true,
    isActivated: true,
    trainingModulesCompleted: 3,
    currentLayer: 1,
    monthsSinceActivation: 2,
    profileComplete: true,
    hasUsedBenefits: true,
    activeDirects: 3,
    complianceScore: 4,
  };
  const { statusInfo } = useStatus(mockUserData);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: 24 }}>
        <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 3, fontFamily: 'Montserrat,sans-serif', marginBottom: 4 }}>RANKING GLOBAL</p>
        <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 22, marginBottom: 10 }}>Tu posición dentro del sistema</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Tu posición', value: `#${myEntry.pos}` },
            { label: 'Tu nivel', value: `Nivel ${myEntry.level}` },
            { label: 'Top %', value: `Top 8%` },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, color: 'white', fontSize: 18 }}>{s.value}</p>
            </div>
          ))}
          <div style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', flex: 1, minWidth: 160 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.5 }}>🔥 Estás en el top 8% del sistema. Sigue avanzando para subir de posición.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
              color: tab === t.id ? 'white' : 'rgba(255,255,255,0.45)',
              outline: tab === t.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
            }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, overflow: 'hidden' }}>
        {data.map((entry, i) => {
          const isTop3 = entry.pos <= 3;
          const isMe = entry.isMe;
          const isSep = i > 0 && entry.pos > data[i - 1].pos + 1;
          return (
            <div key={i}>
              {isSep && (
                <div style={{ padding: '6px 20px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>···</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                background: isMe ? 'rgba(59,130,246,0.12)' : isTop3 ? 'rgba(245,158,11,0.04)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                {/* Position */}
                <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                  {entry.pos <= 3
                    ? <Crown size={18} style={{ color: posColor(entry.pos) }} />
                    : <span style={{ color: posColor(entry.pos), fontWeight: 700, fontSize: 14 }}>#{entry.pos}</span>}
                </div>

                {/* Avatar */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isMe ? 'linear-gradient(135deg,#1d6ef5,#3b82f6)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, color: 'white', fontSize: 13 }}>
                  {entry.name[0]}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: isMe ? 'white' : 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: isMe ? 700 : 500 }}>{entry.name}</span>
                    {entry.country !== '—' && <span style={{ fontSize: 14 }}>{entry.country}</span>}
                    {isMe && <span style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.5)', color: '#60a5fa', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>TÚ</span>}
                    {isMe && statusInfo && <span style={{ background: `${statusInfo.color}30`, border: `1px solid ${statusInfo.color}50`, color: statusInfo.color, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}><Star size={8} /> {statusInfo.name}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, maxWidth: 120 }}>
                      <div style={{ height: '100%', width: `${entry.progress}%`, background: isTop3 ? '#f59e0b' : '#3b82f6', borderRadius: 2 }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{entry.progress}%</span>
                  </div>
                </div>

                {/* Level */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Nivel</p>
                  <p style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, color: isTop3 ? posColor(entry.pos) : 'rgba(255,255,255,0.6)', fontSize: 16 }}>{entry.level}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}