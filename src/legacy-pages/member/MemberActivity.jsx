import { useState, useMemo } from 'react';
import { Calendar, Search, Activity as ActivityIcon, Users, Zap, TrendingUp, DollarSign, Mail, Network, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const ACTIVITY_EVENTS = [
  { type: 'join',          label: 'Nuevo miembro en red',     member: 'Juan García',      date: '2 horas',   color: '#3b82f6'  },
  { type: 'activation',   label: 'Activación de plan',       member: 'María López',      date: '5 horas',   color: '#3b82f6'  },
  { type: 'rank',         label: 'Ascenso de rango',         member: 'Carlos Ruiz',      date: '1 día',     color: '#7C3AED'  },
  { type: 'bonus',        label: 'Bonificación procesada',   member: 'Tu cuenta',        date: '2 días',    color: '#A78BFA'  },
  { type: 'communication',label: 'Mensaje recibido',         member: 'Sistema',          date: '3 días',    color: '#3b82f6'  },
  { type: 'network',      label: 'Crecimiento de rama',      member: 'Red izquierda +2', date: '5 días',    color: '#3b82f6'  },
  { type: 'profile',      label: 'Actualización de perfil',  member: 'Tu información',   date: '1 semana',  color: '#6B7280'  },
  { type: 'training',     label: 'Capacitación completada',  member: 'Módulo Premium',   date: '1 semana',  color: '#A78BFA'  },
];

export default function MemberActivity() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredActivity = useMemo(() => {
    return ACTIVITY_EVENTS.filter(event => {
      const matchesSearch = event.label.toLowerCase().includes(search.toLowerCase()) ||
                           event.member.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || event.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'join', label: 'Nuevos Miembros' },
    { value: 'activation', label: 'Activaciones' },
    { value: 'rank', label: 'Rangos' },
    { value: 'bonus', label: 'Bonificaciones' },
  ];

  return (
    <div className="max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8" style={{ background: '#05070D', minHeight: '100vh' }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px 0' }}>Panel · Actividad</p>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
          Actividad y Movimiento
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
          Timeline de eventos en tu red y plataforma
        </p>
      </motion.div>

      {/* SEARCH & FILTER */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-3">
        <div className="relative">
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/30"
            style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(59,130,246,0.12)', outline: 'none' }}
          />
        </div>
        <div className="flex max-w-full gap-2 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="min-h-10 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: filter === opt.value ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                color: filter === opt.value ? '#93C5FD' : 'rgba(255,255,255,0.4)',
                border: filter === opt.value ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* TIMELINE — alive, rhythmic, readable */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ borderRadius: 16, background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        {filteredActivity.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <ActivityIcon size={24} style={{ color: 'rgba(255,255,255,0.12)', margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>No hay eventos que coincidan</p>
          </div>
        ) : (
          filteredActivity.map((event, i) => {
            const iconMap = { join: Users, activation: Zap, rank: TrendingUp, bonus: DollarSign, communication: Mail, network: Network, profile: User, training: BookOpen };
            const Icon = iconMap[event.type] || ActivityIcon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px',
                  borderBottom: i < filteredActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  borderLeft: `2px solid ${event.color}30`,
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  transition: 'background 150ms ease',
                }}
              >
                {/* Event icon */}
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${event.color}0D`, border: `1px solid ${event.color}20` }}>
                  <Icon size={14} style={{ color: event.color }} strokeWidth={1.5} />
                </div>

                {/* Primary content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, margin: '0 0 3px 0', letterSpacing: '-0.1px' }}>{event.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.member}</p>
                </div>

                {/* Meta: type badge + timestamp */}
                <div className="hidden sm:flex" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 5, background: `${event.color}10`, border: `1px solid ${event.color}20`, color: event.color, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {event.type}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={9} />{event.date}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
