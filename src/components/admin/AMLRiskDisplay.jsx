import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import AMLRiskManager from '@/lib/AMLRiskManager';

export default function AMLRiskDisplay({ paymentId, userId = null, compact = false }) {
  const [assessment, setAssessment] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (paymentId) {
      const assess = AMLRiskManager.getPaymentRiskAssessment(paymentId);
      setAssessment(assess);
    }
    if (userId) {
      const prof = AMLRiskManager.getUserRiskProfile(userId);
      setProfile(prof);
    }
  }, [paymentId, userId]);

  const getRiskColor = (level) => {
    const colors = { low: '#10b981', medium: '#fb923c', high: '#ef4444' };
    return colors[level] || '#9ca3af';
  };

  const getRiskIcon = (level) => {
    if (level === 'low') return CheckCircle;
    if (level === 'medium') return AlertCircle;
    return AlertTriangle;
  };

  // Display payment risk
  if (assessment) {
    const Icon = getRiskIcon(assessment.level);
    const color = getRiskColor(assessment.level);

    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: 0 }}>AML Risk</p>
            <p style={{ color, fontWeight: 700, fontSize: 11, margin: '2px 0 0 0' }}>
              {assessment.level.toUpperCase()} ({assessment.score})
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Risk Level */}
        <div className="p-4 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: 0 }}>AML RISK LEVEL</p>
              <p style={{ color, fontSize: 18, fontWeight: 900, margin: '3px 0 0 0' }}>
                {assessment.level.toUpperCase()}
              </p>
            </div>
            <Icon size={28} style={{ color }} />
          </div>
          <div className="w-full bg-black/20 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${assessment.score}%`, background: color }}
            />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '8px 0 0 0' }}>
            Score: {assessment.score}/100
          </p>
        </div>

        {/* Risk Factors */}
        <div className="space-y-2">
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, margin: 0 }}>RISK FACTORS</p>
          {assessment.factors.map((factor, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{factor}</span>
            </div>
          ))}
        </div>

        {/* Red Flags */}
        {assessment.redFlags.length > 0 && (
          <div className="space-y-2">
            <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, margin: 0 }}>⚠️ RED FLAGS</p>
            {assessment.redFlags.map((flag, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ color: '#ef4444', fontSize: 11 }}>{flag}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Action */}
        <div className="p-3 rounded-lg" style={{ background: assessment.needsReview ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: assessment.needsReview ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>RECOMMENDED ACTION</p>
          <p style={{ color: assessment.needsReview ? '#ef4444' : '#10b981', fontSize: 12, fontWeight: 600, margin: '4px 0 0 0' }}>
            {assessment.recommendedAction}
          </p>
        </div>
      </div>
    );
  }

  // Display user profile risk
  if (profile) {
    const Icon = getRiskIcon(profile.level);
    const color = getRiskColor(profile.level);

    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: 0 }}>User Risk</p>
            <p style={{ color, fontWeight: 700, fontSize: 11, margin: '2px 0 0 0' }}>
              {profile.level.toUpperCase()} ({profile.score})
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Risk Level */}
        <div className="p-4 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: 0 }}>USER RISK PROFILE</p>
              <p style={{ color, fontSize: 18, fontWeight: 900, margin: '3px 0 0 0' }}>
                {profile.level.toUpperCase()}
              </p>
            </div>
            <Icon size={28} style={{ color }} />
          </div>
          <div className="w-full bg-black/20 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${profile.score}%`, background: color }}
            />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '8px 0 0 0' }}>
            Score: {profile.score}/100
          </p>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: 0 }}>PAYMENTS</p>
            <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '3px 0 0 0' }}>
              {profile.paymentCount}
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: 0 }}>VOLUME</p>
            <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '3px 0 0 0' }}>
              ${(profile.totalVolume / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-2">
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, margin: 0 }}>RISK FACTORS</p>
          {profile.factors.map((factor, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{factor}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}