/**
 * VICION — Campaign Intelligence Layer
 * Deterministic lifecycle simulation. No random spikes.
 * Each campaign follows a realistic marketing performance arc.
 *
 * Lifecycle phases (day-based from startDate):
 *  0–7    → LAUNCH: ramp-up, high engagement, low fatigue
 *  8–21   → PEAK: best performance window
 *  22–40  → DECAY: creative fatigue kicks in, CTR drops
 *  41–60  → SATURATED: audience overlap, diminishing returns
 *  61+    → FATIGUED: needs refresh or pause
 *
 * Creative refresh events reset the decay clock.
 * Referral surges boost organic signal independently.
 */

// ─── CAMPAIGN LIFECYCLE CONFIG ─────────────────────────────────────────────

// Each campaign has a defined lifecycle timeline (relative days from startDate)
// and a series of events that shift performance curves.

export const CAMPAIGN_LIFECYCLE = {
  'CAM-001': {
    // Spring LATAM — Meta Ads — running since Jan 5
    daysSinceStart: 98,
    phase: 'fatigued',
    events: [
      { day: 0,  type: 'launch',          label: 'Campaign launched — Meta LATAM',          impact: +12 },
      { day: 7,  type: 'peak',            label: 'Peak engagement — MX audience responding', impact: +18 },
      { day: 21, type: 'creative_refresh', label: 'New creative set deployed — video ads',   impact: +10 },
      { day: 35, type: 'decay',           label: 'Creative fatigue detected — CTR -22%',     impact: -8  },
      { day: 50, type: 'saturation',      label: 'MX audience overlap 68% — targeting exhausted', impact: -14 },
      { day: 72, type: 'audience_expand', label: 'BR audience added — partial recovery',     impact: +6  },
      { day: 88, type: 'fatigue',         label: 'Fatigue deepening — CPA +34% vs launch',   impact: -11 },
    ],
    trendData: [
      { week: 'W1', ctr: 3.8, cpa: 580, conversions: 3, spend: 1400 },
      { week: 'W2', ctr: 4.2, cpa: 520, conversions: 4, spend: 1600 },
      { week: 'W3', ctr: 4.5, cpa: 490, conversions: 4, spend: 1800 }, // peak
      { week: 'W4', ctr: 4.1, cpa: 560, conversions: 3, spend: 1600 }, // refresh bump
      { week: 'W5', ctr: 3.4, cpa: 680, conversions: 3, spend: 1400 }, // decay starts
      { week: 'W6', ctr: 2.9, cpa: 810, conversions: 2, spend: 1200 }, // saturation
      { week: 'W7', ctr: 2.5, cpa: 920, conversions: 1, spend: 1100 }, // deep fatigue
      { week: 'W8', ctr: 2.1, cpa: 1040, conversions: 1, spend: 940 },
    ],
    currentHealth: 28,
    healthTrend: 'declining',
    recommendation: {
      action: 'REFRESH_CREATIVE',
      label: 'New Creative Required',
      detail: 'CTR has declined 44% from peak. Deploy fresh video assets targeting CO/PE expansion markets. Consider 3-day pause before relaunch.',
      urgency: 'high',
    },
  },

  'CAM-002': {
    // TikTok Growth Wave — running since Feb 1
    daysSinceStart: 71,
    phase: 'saturated',
    events: [
      { day: 0,  type: 'launch',          label: 'TikTok campaign launched — Gen Z global',  impact: +8  },
      { day: 5,  type: 'peak',            label: 'Viral hook performing — watch rate 68%',    impact: +15 },
      { day: 14, type: 'decay',           label: 'Hook fatigue — same creative 14 days',      impact: -10 },
      { day: 20, type: 'creative_refresh', label: 'UGC content batch deployed',               impact: +9  },
      { day: 32, type: 'saturation',      label: 'Audience saturation — ES+IT overlap 74%',   impact: -12 },
      { day: 45, type: 'testing',         label: 'A/B test — 3 new hooks in rotation',        impact: +5  },
      { day: 60, type: 'decay',           label: 'Winning hook fatiguing — engagement -18%',  impact: -8  },
    ],
    trendData: [
      { week: 'W1', ctr: 2.1, cpa: 980, conversions: 1, spend: 900  },
      { week: 'W2', ctr: 3.4, cpa: 720, conversions: 2, spend: 1100 }, // viral peak
      { week: 'W3', ctr: 2.8, cpa: 860, conversions: 1, spend: 980  }, // decay
      { week: 'W4', ctr: 3.2, cpa: 790, conversions: 2, spend: 1050 }, // ugc refresh
      { week: 'W5', ctr: 2.4, cpa: 980, conversions: 1, spend: 920  }, // saturation
      { week: 'W6', ctr: 2.6, cpa: 940, conversions: 1, spend: 870  }, // ab test
      { week: 'W7', ctr: 2.2, cpa: 1080, conversions: 1, spend: 790 }, // fatiguing
    ],
    currentHealth: 41,
    healthTrend: 'declining',
    recommendation: {
      action: 'AB_TEST_SCALE',
      label: 'Scale Winning Hook',
      detail: 'Current A/B test shows Hook C outperforming by 31%. Pause underperformers, double budget on Hook C before full saturation.',
      urgency: 'medium',
    },
  },

  'CAM-003': {
    // Google Discovery Europe — running since Dec 10
    daysSinceStart: 124,
    phase: 'stable',
    events: [
      { day: 0,  type: 'launch',          label: 'Google Discovery launched — EU intent',     impact: +10 },
      { day: 10, type: 'peak',            label: 'Peak period — holiday search intent high',   impact: +20 },
      { day: 22, type: 'decay',           label: 'Post-holiday decay — lower search intent',   impact: -8  },
      { day: 38, type: 'audience_expand', label: 'DE+BE markets added to targeting',           impact: +12 },
      { day: 55, type: 'creative_refresh', label: 'New ad copy — benefit-led messaging',       impact: +8  },
      { day: 80, type: 'testing',         label: 'Smart bidding test — tCPA vs manual',        impact: +5  },
      { day: 100, type: 'stable',         label: 'tCPA bidding stabilized — efficiency peak',  impact: +3  },
    ],
    trendData: [
      { week: 'W1', ctr: 4.8, cpa: 1800, conversions: 1, spend: 1800 },
      { week: 'W2', ctr: 5.6, cpa: 1540, conversions: 2, spend: 2200 }, // holiday peak
      { week: 'W3', ctr: 5.1, cpa: 1650, conversions: 1, spend: 1900 },
      { week: 'W4', ctr: 4.2, cpa: 1800, conversions: 1, spend: 1700 }, // post-holiday
      { week: 'W5', ctr: 4.9, cpa: 1620, conversions: 1, spend: 1800 }, // DE expand
      { week: 'W6', ctr: 5.3, cpa: 1480, conversions: 2, spend: 1900 }, // copy refresh
      { week: 'W7', ctr: 5.5, cpa: 1400, conversions: 2, spend: 2000 }, // bidding stable
      { week: 'W8', ctr: 5.7, cpa: 1360, conversions: 2, spend: 2100 }, // efficiency
    ],
    currentHealth: 82,
    healthTrend: 'stable',
    recommendation: {
      action: 'SCALE_BUDGET',
      label: 'Scale Budget +20%',
      detail: 'tCPA bidding has stabilized at 15% below target. Campaign is in efficiency zone. Recommended +20% budget increase to capture remaining intent volume in DE/FR.',
      urgency: 'low',
    },
  },

  'CAM-004': {
    // Community Referral Drive — running since Jan 10
    daysSinceStart: 93,
    phase: 'peak',
    events: [
      { day: 0,  type: 'launch',          label: 'Referral program activated — leaders onboarded', impact: +5  },
      { day: 8,  type: 'referral_surge',  label: 'Carlos López chain activated — 8 referrals',     impact: +18 },
      { day: 20, type: 'peak',            label: 'Network effect building — 4 active chains',       impact: +22 },
      { day: 35, type: 'referral_surge',  label: 'Ana Silva + Valentina Cruz chains surge',         impact: +14 },
      { day: 52, type: 'decay',           label: 'Primary network nearing capacity — slowdown',     impact: -6  },
      { day: 68, type: 'audience_expand', label: 'GH + NG markets onboarded — fresh network',      impact: +11 },
      { day: 82, type: 'peak',            label: 'Africa network activating — Kevin + David chains', impact: +9  },
    ],
    trendData: [
      { week: 'W1', ctr: null, cpa: 140, conversions: 2, spend: 280  },
      { week: 'W2', ctr: null, cpa: 108, conversions: 4, spend: 432  }, // Lopez surge
      { week: 'W3', ctr: null, cpa: 95,  conversions: 5, spend: 475  }, // network peak
      { week: 'W4', ctr: null, cpa: 112, conversions: 4, spend: 448  },
      { week: 'W5', ctr: null, cpa: 128, conversions: 3, spend: 384  }, // slowdown
      { week: 'W6', ctr: null, cpa: 105, conversions: 4, spend: 420  }, // GH expand
      { week: 'W7', ctr: null, cpa: 98,  conversions: 5, spend: 490  }, // Africa peak
      { week: 'W8', ctr: null, cpa: 117, conversions: 4, spend: 468  },
    ],
    currentHealth: 76,
    healthTrend: 'rising',
    recommendation: {
      action: 'EXPAND_NETWORK',
      label: 'Onboard 2 New Leaders',
      detail: 'Africa expansion generating strong chain velocity. Onboard 2 additional leaders in NG+GH to extend reach. IN network (Priya reactivation) represents +15 potential referrals.',
      urgency: 'medium',
    },
  },

  'CAM-005': {
    // Africa Influencer Network — running since Feb 15
    daysSinceStart: 57,
    phase: 'testing',
    events: [
      { day: 0,  type: 'launch',          label: 'Influencer campaign launched — GH + NG',         impact: +7  },
      { day: 6,  type: 'peak',            label: 'Influencer posts live — strong community trust',  impact: +16 },
      { day: 15, type: 'testing',         label: 'Testing micro vs macro influencer performance',   impact: 0   },
      { day: 25, type: 'creative_refresh', label: 'New testimonial content from Kevin Osei',        impact: +9  },
      { day: 38, type: 'saturation',      label: 'Accra audience overlap — diversify to Lagos',    impact: -7  },
      { day: 50, type: 'audience_expand', label: 'Lagos market activated — David network',          impact: +10 },
    ],
    trendData: [
      { week: 'W1', ctr: 1.8, cpa: 900, conversions: 1, spend: 700  },
      { week: 'W2', ctr: 3.1, cpa: 640, conversions: 2, spend: 880  }, // influencer peak
      { week: 'W3', ctr: 2.9, cpa: 710, conversions: 2, spend: 820  }, // testing
      { week: 'W4', ctr: 3.4, cpa: 620, conversions: 2, spend: 860  }, // testimonial
      { week: 'W5', ctr: 2.6, cpa: 780, conversions: 1, spend: 740  }, // saturation
      { week: 'W6', ctr: 3.0, cpa: 690, conversions: 2, spend: 800  }, // Lagos expand
    ],
    currentHealth: 61,
    healthTrend: 'recovering',
    recommendation: {
      action: 'DIVERSIFY_MARKETS',
      label: 'Activate IN Market',
      detail: 'Lagos diversification is working. Next step: activate IN influencer network via Priya Sharma reactivation to unlock Bangalore + Mumbai audience segments.',
      urgency: 'medium',
    },
  },

  'CAM-006': {
    // APAC Email Re-engagement — completed
    daysSinceStart: 83,
    phase: 'completed',
    events: [
      { day: 0,  type: 'launch',          label: 'Email series launched — 4-step re-engagement', impact: +5  },
      { day: 7,  type: 'peak',            label: 'Email 2 delivered — 41% open rate',             impact: +18 },
      { day: 14, type: 'peak',            label: 'Email 3 — urgency sequence — 5 conversions',    impact: +22 },
      { day: 25, type: 'decay',           label: 'Unsubscribe rate rising — 3.2%',                impact: -9  },
      { day: 40, type: 'saturation',      label: 'List exhausted — remaining are non-converters', impact: -18 },
      { day: 55, type: 'completed',       label: 'Campaign concluded — budget fully deployed',    impact: 0   },
    ],
    trendData: [
      { week: 'W1', ctr: 8.2, cpa: 600, conversions: 1, spend: 500  },
      { week: 'W2', ctr: 9.4, cpa: 480, conversions: 2, spend: 640  }, // peak
      { week: 'W3', ctr: 8.8, cpa: 520, conversions: 2, spend: 560  }, // peak
      { week: 'W4', ctr: 6.2, cpa: 720, conversions: 1, spend: 500  }, // decay
      { week: 'W5', ctr: 3.8, cpa: 1100, conversions: 0, spend: 250 }, // exhausted
    ],
    currentHealth: 100,
    healthTrend: 'completed',
    recommendation: {
      action: 'REACTIVATE_SEGMENT',
      label: 'Plan Phase 2 Sequence',
      detail: 'Campaign concluded with 4/5 conversions from Elite/Premium segment. 12 non-converters should enter a 90-day nurture sequence before next touch.',
      urgency: 'low',
    },
  },
};

// ─── PHASE METADATA ────────────────────────────────────────────────────────

export const PHASE_CONFIG = {
  launch:    { label: 'Launch',     color: '#3b82f6', icon: '🚀', health: [60, 85] },
  peak:      { label: 'Peak',       color: '#10b981', icon: '📈', health: [75, 95] },
  testing:   { label: 'Testing',    color: '#06b6d4', icon: '🧪', health: [55, 70] },
  stable:    { label: 'Stable',     color: '#8b5cf6', icon: '📊', health: [70, 88] },
  decay:     { label: 'Decaying',   color: '#fb923c', icon: '📉', health: [35, 55] },
  saturated: { label: 'Saturated',  color: '#f59e0b', icon: '⚠️', health: [25, 45] },
  fatigued:  { label: 'Fatigued',   color: '#ef4444', icon: '🔴', health: [10, 30] },
  recovering:{ label: 'Recovering', color: '#a78bfa', icon: '🔄', health: [50, 68] },
  completed: { label: 'Completed',  color: '#6b7280', icon: '✅', health: [100, 100] },
};

export const ACTION_CONFIG = {
  REFRESH_CREATIVE:   { color: '#ef4444', label: 'Refresh Creative' },
  AB_TEST_SCALE:      { color: '#3b82f6', label: 'Scale Winner' },
  SCALE_BUDGET:       { color: '#10b981', label: 'Scale Budget' },
  EXPAND_NETWORK:     { color: '#8b5cf6', label: 'Expand Network' },
  DIVERSIFY_MARKETS:  { color: '#06b6d4', label: 'Diversify' },
  REACTIVATE_SEGMENT: { color: '#6b7280', label: 'Plan Phase 2' },
  PAUSE:              { color: '#fb923c', label: 'Pause Campaign' },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

export function getCampaignIntelligence(campaignId) {
  return CAMPAIGN_LIFECYCLE[campaignId] || null;
}

export function getAllCampaignHealth() {
  return Object.entries(CAMPAIGN_LIFECYCLE).map(([id, data]) => ({
    id,
    phase: data.phase,
    health: data.currentHealth,
    trend: data.healthTrend,
    recommendation: data.recommendation,
  }));
}

// Compute cumulative health score from events
export function computeHealthFromEvents(events, daysSinceStart) {
  let health = 50;
  events.forEach(e => {
    if (e.day <= daysSinceStart) {
      health = Math.min(100, Math.max(0, health + e.impact));
    }
  });
  return health;
}