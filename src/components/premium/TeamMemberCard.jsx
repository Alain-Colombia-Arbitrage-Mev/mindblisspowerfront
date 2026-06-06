import { useState } from 'react';
import { MessageSquare, Phone, Mail, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { getRankColor, getInvestmentStatusColor } from './LiveIndicator';
import NetworkGraphEngine from './NetworkGraphEngine';

export default function TeamMemberCard({ member, onMessage, onContact, onView }) {
  const [isHovered, setIsHovered] = useState(false);

  const investmentColor = getInvestmentStatusColor(member.investment_amount);
  const rankColor = getRankColor(member.rank);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="p-4 rounded-lg cursor-pointer transition-all"
      style={{
        background: isHovered ? 'rgba(255,255,255,0.06)' : '#121821',
        border: isHovered ? `1px solid ${investmentColor}` : '1px solid #1F2A37',
        boxShadow: isHovered ? `0 8px 24px rgba(0,0,0,0.4)` : 'none',
      }}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: investmentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: 'white',
              fontWeight: 700,
            }}
          >
            {NetworkGraphEngine.getRankIcon(member.rank)}
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: 0 }}>
              {member.full_name}
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
              {member.rank}
            </p>
          </div>
        </div>
        {member.investment_amount >= 5000 && (
          <span style={{ fontSize: 12, color: '#fbbf24' }}>⭐</span>
        )}
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: '0 0 2px 0', fontWeight: 600 }}>
            Investment
          </p>
          <p style={{ color: investmentColor, fontSize: 10, fontWeight: 700, margin: 0 }}>
            ${member.investment_amount.toLocaleString()}
          </p>
        </div>
        <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: '0 0 2px 0', fontWeight: 600 }}>
            Status
          </p>
          <p
            style={{
              color: member.status === 'active' ? '#10b981' : '#6B7280',
              fontSize: 10,
              fontWeight: 700,
              margin: 0,
            }}
          >
            {member.status === 'active' ? '✓' : '○'}
          </p>
        </div>
      </div>

      {/* CONTACT INFO */}
      <div className="text-xs space-y-1 mb-3">
        {member.country && (
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            📍 {member.country}
          </p>
        )}
        {member.email && (
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, wordBreak: 'break-all' }}>
            {member.email}
          </p>
        )}
      </div>

      {/* ACTIONS */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          {member.email && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMessage?.(member);
              }}
              className="flex-1 px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all"
              style={{
                background: 'rgba(59,130,246,0.2)',
                color: '#3b82f6',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <MessageSquare size={10} />
              Message
            </button>
          )}
          {member.phone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onContact?.(member);
              }}
              className="flex-1 px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all"
              style={{
                background: 'rgba(16,185,129,0.2)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              <Phone size={10} />
              Call
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(member);
            }}
            className="px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Eye size={10} />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}