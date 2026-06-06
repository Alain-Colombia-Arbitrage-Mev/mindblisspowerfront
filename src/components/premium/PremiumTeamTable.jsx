import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Flag, Eye } from 'lucide-react';
import TeamMemberCard from './TeamMemberCard';

export default function PremiumTeamTable({ members, selectedMember, onSelectMember, selectedMembers, onSelectCheckbox, sortBy, sortOrder, filters, searchTerm, tags, onToggleTag, onMessage, onContact, onView }) {
  const [viewMode, setViewMode] = useState('table'); // table or cards

  const statusColor = (status) => status === 'activo' ? '#10b981' : '#9ca3af';
  const sideColor = (side) => side === 'left' ? '#3b82f6' : '#ec4899';

  const getTagColor = (tag) => {
    if (tag === 'priority') return { bg: 'rgba(251,146,60,0.2)', text: '#fb923c' };
    if (tag === 'follow') return { bg: 'rgba(139,92,246,0.2)', text: '#8b5cf6' };
    if (tag === 'inactive') return { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' };
    return { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.6)' };
  };

  const isRecentlyActive = (lastActivity) => {
    if (!lastActivity) return false;
    const days = (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24);
    return days < 7;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* VIEW MODE TOGGLE */}
      <div className="px-6 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setViewMode('table')}
          className="px-3 py-1.5 rounded text-xs font-semibold"
          style={{
            background: viewMode === 'table' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
            color: viewMode === 'table' ? '#3b82f6' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${viewMode === 'table' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          📊 Tabla
        </button>
        <button
          onClick={() => setViewMode('cards')}
          className="px-3 py-1.5 rounded text-xs font-semibold"
          style={{
            background: viewMode === 'cards' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
            color: viewMode === 'cards' ? '#3b82f6' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${viewMode === 'cards' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          🎴 Tarjetas
        </button>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="flex-1 overflow-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(4,10,22,0.95)', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === members.length && members.length > 0}
                    onChange={(e) => onSelectCheckbox(e.target.checked ? members.map(m => m.id) : [])}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                {['Nombre', 'País', 'Rango', 'Plan', 'Inversión', 'Estado', 'Actividad', 'Lado', 'Gen'].map((col, i) => (
                  <th key={i} style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member, idx) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => onSelectMember(member)}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: selectedMember?.id === member.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedMember?.id === member.id ? 'rgba(59,130,246,0.1)' : 'transparent'}
                >
                  <td style={{ padding: '12px', color: 'white' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={(e) => onSelectCheckbox(e.target.checked ? [...selectedMembers, member.id] : selectedMembers.filter(id => id !== member.id))}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '12px', color: 'white', fontSize: 12, fontWeight: 600 }}>
                    <div>
                      {member.name}
                      {tags[member.id] && tags[member.id].length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {tags[member.id].map(tag => {
                            const colors = getTagColor(tag);
                            return (
                              <span key={tag} style={{
                                background: colors.bg,
                                color: colors.text,
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 9,
                                fontWeight: 600,
                              }}>
                                {tag === 'priority' ? '⭐' : tag === 'follow' ? '👁️' : '⚠️'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{member.country}</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{member.rank || '-'}</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{member.plan}</td>
                  <td style={{ padding: '12px', color: '#10b981', fontSize: 11, fontWeight: 700 }}>${(member.investment || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: statusColor(member.status) + '30', color: statusColor(member.status), padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                      {member.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: isRecentlyActive(member.last_activity) ? 'rgba(16,185,129,0.2)' : 'rgba(156,163,175,0.2)',
                      color: isRecentlyActive(member.last_activity) ? '#10b981' : '#9ca3af',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                    }}>
                      {isRecentlyActive(member.last_activity) ? '🟢' : '⚫'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: sideColor(member.binary_side), fontSize: 11, fontWeight: 600 }}>
                    {member.binary_side === 'left' ? '← Izq' : '→ Der'}
                  </td>
                  <td style={{ padding: '12px', color: '#fb923c', fontSize: 11, fontWeight: 600 }}>{member.generation}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {members.map((member, idx) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onMessage={() => onMessage(member)}
                onContact={() => onContact(member)}
                onView={() => onView(member)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}