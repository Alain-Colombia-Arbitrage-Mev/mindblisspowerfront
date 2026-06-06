import { Bell } from 'lucide-react';

export default function TopBar({ user }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      background: '#F8FAFC',
      borderBottom: '1px solid #E2E8F0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2F80ED, #5BA3F5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 14,
          fontWeight: 700,
        }}>
          {user?.full_name?.[0] || 'M'}
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0A1F44', margin: 0 }}>
            {user?.full_name?.split(' ')[0] || 'Miembro'}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
            Participante activo
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: '#ECFDF5',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          color: '#27AE60',
        }}>
          ● Activo
        </div>

        <button style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748B',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F1F5F9';
          e.currentTarget.style.color = '#0A1F44';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF';
          e.currentTarget.style.color = '#64748B';
        }}
        >
          <Bell size={16} />
        </button>
      </div>
    </div>
  );
}