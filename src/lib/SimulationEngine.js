/**
 * VICION Admin — Operational Simulation Engine
 * Realistic cadence. Credible lifecycles. Demo-grade fidelity.
 *
 * Design principles:
 * - Events fire slowly and reflect real business processes
 * - KPIs change by small, plausible deltas
 * - Activity log reads like a real audit trail
 * - Status transitions follow logical sequences
 * - No random spikes or arcade behavior
 */

import { PARTICIPANTS_DATA, LEADERS_DATA } from './SimulatedData';
import { CAMPAIGNS } from './acquisitionData';
import unifiedDataEngine from './UnifiedDataEngine';

// ─── REFERENCE DATA ────────────────────────────────────────────────────────

const NAMES = [
  ['Santiago', 'Muñoz'], ['Valentina', 'Ríos'], ['Andrés', 'Castañeda'],
  ['Daniela', 'Morales'], ['Felipe', 'Guerrero'], ['Isabella', 'Vargas'],
  ['Mateo', 'Ramírez'], ['Catalina', 'Espinosa'], ['Sebastián', 'Heredia'],
  ['Mariana', 'Acosta'], ['Paulo', 'Barbosa'], ['Beatriz', 'Nunes'],
  ['Antoine', 'Lefebvre'], ['Marie', 'Chevalier'], ['Luca', 'Ferrari'],
  ['Giulia', 'Conti'], ['Akira', 'Tanaka'], ['Yuki', 'Sato'],
  ['Fatima', 'Diallo'], ['Amara', 'Koné'], ['James', 'Osei'],
  ['Grace', 'Mensah'], ['Rafael', 'Montoya'], ['Claudia', 'Zapata'],
  ['Henrik', 'Larsen'], ['Astrid', 'Nielsen'], ['Priya', 'Sharma'],
  ['Carlos', 'Venegas'], ['Elena', 'Marchetti'], ['Tomás', 'Aguilar'],
];

const COUNTRIES = ['MX', 'BR', 'CO', 'AR', 'ES', 'FR', 'IT', 'GH', 'NG', 'IN', 'BE', 'PT', 'PE', 'CL', 'DE'];
const SOURCES   = ['Referral', 'Referral', 'Organic', 'Campaign', 'Campaign', 'Social', 'Direct']; // Referral weighted higher
const ACTIVE_CAMPAIGNS = CAMPAIGNS.filter(c => c.status === 'active');
const ADVISORS  = ['J. Smith', 'M. Lee', 'S. Johnson', 'K. Torres', 'A. Reyes'];
const PLANS = [
  { name: 'Basic',    amount: 500  },
  { name: 'Standard', amount: 1000 },
  { name: 'Growth',   amount: 2500 },
  { name: 'Premium',  amount: 5000 },
  { name: 'Elite',    amount: 10000 },
];
const SUPPORT_TOPICS = [
  'Payment not reflected in account',
  'KYC document pending review',
  'Plan upgrade request submitted',
  'Leader assignment discrepancy',
  'Incentive calculation query',
  'Account access issue reported',
  'Referral credit not received',
  'Transfer confirmation required',
  'Identity document resubmission needed',
  'Activation timeline question',
];
const PAYMENT_METHODS = ['Bank Transfer', 'Bank Transfer', 'Card', 'Cash Deposit', 'Crypto'];

// ─── ENGINE STATE ──────────────────────────────────────────────────────────

function buildBaselineKpis() {
  // Use unified data engine instead of static data
  const allUsers = unifiedDataEngine.users;
  const verified = unifiedDataEngine.payments.filter(p => p.status === 'completado');
  return {
    totalParticipants:    allUsers.length,
    activeLeaders:        allUsers.filter(l => l.role === 'leader' && l.status === 'activo').length,
    activePlans:          allUsers.filter(p => p.status === 'activo').length,
    pendingVerifications: allUsers.filter(p => p.status === 'pendiente').length,
    paymentVolume:        Math.round(verified.reduce((s, p) => s + (p.amount || 0), 0) / 1000),
    conversionRate:       68.4,
    supportIncidents:     unifiedDataEngine.alerts.length,
    growthSignal:         22,
  };
}

let _state = {
  running:  false,
  speed:    'medium',
  intervalId: null,
  tick:     0,
  kpis:     buildBaselineKpis(),
  activityLog: [
    { action: 'Payment verified',        detail: 'Mathieu Bernard (FR) · $10,000 · Bank Transfer', time: '8m ago',  color: '#10b981' },
    { action: 'KYC documents approved',  detail: 'Chidi Okafor (NG) · Identity confirmed',          time: '17m ago', color: '#10b981' },
    { action: 'New participant registered', detail: 'Camille Rousseau (FR) · Referral · $5,000 plan', time: '26m ago', color: '#3b82f6' },
    { action: 'Support case opened',     detail: 'Payment timing — Lucía Fernández (MX) · P-1042',  time: '34m ago', color: '#fb923c' },
    { action: 'Plan upgrade processed',  detail: 'Ana Souza (BR) · Standard → Premium · +$4,000',   time: '51m ago', color: '#a855f7' },
    { action: 'Payment under review',    detail: 'Transfer · $5,000 · Origin unclear (ES)',          time: '1h ago',  color: '#06b6d4' },
    { action: 'Support case resolved',   detail: 'Referral credit — Pedro Alves (PT) · confirmed',  time: '1h 14m ago', color: '#10b981' },
    { action: 'Advisor reassigned',      detail: 'Diego Restrepo (CO) → K. Torres',                 time: '1h 29m ago', color: '#fb923c' },
  ],
  alerts: [],
  _pipeline: [], // tracks in-flight lifecycle steps
  _subscribers: new Set(),
};

// ─── UTILITIES ─────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function drift(value, min, max, delta = 0.1) {
  // Move value by a tiny amount, clamp to range
  const change = (Math.random() < 0.6 ? 1 : -1) * delta;
  return Math.min(max, Math.max(min, parseFloat((value + change).toFixed(1))));
}

function notify() {
  const snapshot = { ..._state, kpis: { ..._state.kpis } };
  _state._subscribers.forEach(fn => fn(snapshot));
}

function pushActivity(action, detail, color) {
  // Age existing entries
  const aged = _state.activityLog.slice(0, 23).map(a => {
    if (a.time === 'Just now')   return { ...a, time: '1m ago' };
    if (a.time === '1m ago')     return { ...a, time: '3m ago' };
    if (a.time === '3m ago')     return { ...a, time: '8m ago' };
    if (a.time === '8m ago')     return { ...a, time: '17m ago' };
    if (a.time === '17m ago')    return { ...a, time: '29m ago' };
    if (a.time === '29m ago')    return { ...a, time: '45m ago' };
    if (a.time === '45m ago')    return { ...a, time: '1h ago' };
    if (a.time === '1h ago')     return { ...a, time: '1h 20m ago' };
    return { ...a, time: a.time.replace('m ago','').includes('h') ? a.time : '2h+ ago' };
  });
  _state.activityLog = [{ action, detail, time: 'Just now', color }, ...aged];
}

function addAlert(msg, severity = 'warning') {
  _state.alerts = [
    { msg, severity, time: 'Just now' },
    ..._state.alerts.slice(0, 4),
  ];
}

// ─── LIFECYCLE PIPELINE ─────────────────────────────────────────────────────
// Tracks realistic multi-step progressions for new participants

function advancePipeline() {
  if (_state._pipeline.length === 0) return false;
  const item = _state._pipeline[0];

  switch (item.stage) {
    case 'registered': {
      // Move to KYC submission
      pushActivity(
        'KYC documents submitted',
        `${item.name} (${item.country}) · passport + proof of address uploaded`,
        '#06b6d4'
      );
      item.stage = 'kyc_submitted';
      return true;
    }
    case 'kyc_submitted': {
      // Random: approve or request more docs
      if (Math.random() < 0.75) {
        pushActivity(
          'KYC approved',
          `${item.name} (${item.country}) · identity confirmed · proceeding to activation`,
          '#10b981'
        );
        _state.kpis.pendingVerifications = Math.max(0, _state.kpis.pendingVerifications - 1);
        item.stage = 'kyc_approved';
      } else {
        pushActivity(
          'KYC — additional document requested',
          `${item.name} (${item.country}) · secondary ID required`,
          '#fb923c'
        );
        item.stage = 'kyc_pending_docs';
      }
      return true;
    }
    case 'kyc_pending_docs': {
      pushActivity(
        'KYC document resubmitted',
        `${item.name} (${item.country}) · secondary ID received`,
        '#06b6d4'
      );
      item.stage = 'kyc_submitted';
      return true;
    }
    case 'kyc_approved': {
      pushActivity(
        'Payment received',
        `${item.name} (${item.country}) · ${item.method} · $${item.amount.toLocaleString()} · pending verification`,
        '#fb923c'
      );
      _state.kpis.pendingVerifications += 1;
      item.stage = 'payment_pending';
      return true;
    }
    case 'payment_pending': {
      if (item.riskFlag) {
        pushActivity(
          'Payment flagged for AML review',
          `${item.name} · $${item.amount.toLocaleString()} · origin requires clarification`,
          '#ef4444'
        );
        addAlert(`Payment flagged — ${item.name} ($${item.amount.toLocaleString()}) · AML check initiated`, 'critical');
        item.stage = 'payment_aml';
        return true;
      }
      pushActivity(
        'Payment verified',
        `${item.name} (${item.country}) · $${item.amount.toLocaleString()} · ${item.plan} plan · activated`,
        '#10b981'
      );
      _state.kpis.pendingVerifications = Math.max(0, _state.kpis.pendingVerifications - 1);
      _state.kpis.activePlans  = Math.min(_state.kpis.activePlans + 1, _state.kpis.totalParticipants);
      _state.kpis.paymentVolume = _state.kpis.paymentVolume + Math.round(item.amount / 1000 * 10) / 10;
      _state.kpis.conversionRate = drift(_state.kpis.conversionRate, 60, 80, 0.2);
      item.stage = 'active';
      // Remove from pipeline after completing
      _state._pipeline.shift();
      return true;
    }
    case 'payment_aml': {
      // After review — most clear
      if (Math.random() < 0.7) {
        pushActivity(
          'AML review cleared',
          `${item.name} · payment origin confirmed · verified`,
          '#10b981'
        );
        _state.kpis.pendingVerifications = Math.max(0, _state.kpis.pendingVerifications - 1);
        _state.kpis.activePlans = Math.min(_state.kpis.activePlans + 1, _state.kpis.totalParticipants);
        _state.kpis.paymentVolume = _state.kpis.paymentVolume + Math.round(item.amount / 1000 * 10) / 10;
      } else {
        pushActivity(
          'Payment rejected — AML',
          `${item.name} · origin could not be verified · case escalated`,
          '#ef4444'
        );
        addAlert(`Payment rejected after AML review — ${item.name}`, 'critical');
        _state.kpis.pendingVerifications = Math.max(0, _state.kpis.pendingVerifications - 1);
      }
      _state._pipeline.shift();
      return true;
    }
    default:
      _state._pipeline.shift();
      return false;
  }
}

// ─── STANDALONE EVENTS ─────────────────────────────────────────────────────
// Each function is [weight, handler]. Higher weight = more frequent.

const WEIGHTED_EVENTS = [

  // ── Campaign traffic spike / slowdown
  [5, () => {
    if (!ACTIVE_CAMPAIGNS.length) return;
    const cam = pick(ACTIVE_CAMPAIGNS);
    const isSpike = Math.random() < 0.6;
    const spikeCount = rand(2, 6);
    pushActivity(
      isSpike ? 'Campaign traffic spike' : 'Campaign traffic slowdown',
      isSpike
        ? `${cam.name} · +${spikeCount} new leads via ${cam.channel} · conversion tracking active`
        : `${cam.name} · ${cam.channel} · CTR dropped · budget review recommended`,
      isSpike ? '#10b981' : '#fb923c'
    );
    if (isSpike) _state.kpis.conversionRate = drift(_state.kpis.conversionRate, 62, 80, 0.3);
  }],

  // ── Referral burst from active participant
  [4, () => {
    const l = pick(LEADERS_DATA.filter(l => ['active','certified'].includes(l.status)));
    const [first, last] = pick(NAMES);
    const country = pick(COUNTRIES);
    pushActivity(
      'Referral chain activated',
      `${l.name} (${l.country}) → ${first} ${last} (${country}) · referral link clicked · tracking active`,
      '#8b5cf6'
    );
    _state.kpis.totalParticipants += 1;
  }],

  // ── New registration (initiates lifecycle) — low probability per tick
  [8, () => {
    const [first, last] = pick(NAMES);
    const country = pick(COUNTRIES);
    const source  = pick(SOURCES);
    const plan    = pick(PLANS.slice(0, 4));
    const method  = pick(PAYMENT_METHODS);
    const advisor = pick(ADVISORS);
    const leader  = pick(LEADERS_DATA.filter(l => l.status !== 'suspended')).name;
    const isRisk  = Math.random() < 0.12;
    // Assign a campaign if source is Campaign
    const campaign = (source === 'Campaign') ? pick(ACTIVE_CAMPAIGNS)?.name : null;
    const campaignSuffix = campaign ? ` · ${campaign}` : '';

    _state._pipeline.push({
      name: `${first} ${last}`, country, source, plan: plan.name,
      amount: plan.amount, method, advisor, leader,
      riskFlag: isRisk,
      stage: 'registered',
    });

    _state.kpis.totalParticipants += 1;
    _state.kpis.pendingVerifications += 1;

    pushActivity(
      'New participant registered',
      `${first} ${last} (${country}) · ${source}${campaignSuffix} · ${plan.name} plan · assigned to ${advisor}`,
      '#3b82f6'
    );
  }],

  // ── Advance one pipeline item (most common event)
  [30, () => {
    if (_state._pipeline.length > 0) advancePipeline();
  }],

  // ── Support case opened
  [10, () => {
    const p = pick(PARTICIPANTS_DATA);
    const topic = pick(SUPPORT_TOPICS);
    const priority = Math.random() < 0.25 ? 'high' : 'normal';
    pushActivity(
      'Support case opened',
      `${topic} · ${p.name} (${p.country}) · Priority: ${priority}`,
      '#fb923c'
    );
    _state.kpis.supportIncidents += 1;
    if (_state.kpis.supportIncidents >= 18) {
      addAlert(`Support backlog: ${_state.kpis.supportIncidents} open cases — review capacity`, 'warning');
    }
  }],

  // ── Support case resolved
  [12, () => {
    if (_state.kpis.supportIncidents <= 0) return;
    const p = pick(PARTICIPANTS_DATA);
    pushActivity(
      'Support case resolved',
      `${p.name} (${p.country}) · case closed · resolution confirmed`,
      '#10b981'
    );
    _state.kpis.supportIncidents = Math.max(0, _state.kpis.supportIncidents - 1);
  }],

  // ── Leader network growth
  [6, () => {
    const l = pick(LEADERS_DATA.filter(l => ['active','certified'].includes(l.status)));
    const [first, last] = pick(NAMES);
    const country = pick(COUNTRIES);
    pushActivity(
      'Leader network expanded',
      `${l.name} (${l.country}) · new direct referral: ${first} ${last} (${country})`,
      '#8b5cf6'
    );
    // Small chance leader gets certified
    if (Math.random() < 0.08) {
      pushActivity(
        'Leader certification completed',
        `${l.name} (${l.country}) · training module 4 passed · status: certified`,
        '#8b5cf6'
      );
    }
  }],

  // ── Plan upgrade
  [5, () => {
    const upgradeable = PARTICIPANTS_DATA.filter(p => p.status === 'active' && p.amount < 5000);
    const p = pick(upgradeable);
    if (!p) return;
    const currentIdx = PLANS.findIndex(pl => pl.amount === p.amount);
    const nextPlan = PLANS[Math.min(currentIdx + 1, PLANS.length - 1)];
    if (nextPlan.amount === p.amount) return;
    const diff = nextPlan.amount - p.amount;
    pushActivity(
      'Plan upgrade initiated',
      `${p.name} (${p.country}) · ${p.plan} → ${nextPlan.name} · payment diff $${diff.toLocaleString()} pending`,
      '#a855f7'
    );
  }],

  // ── Advisor reassignment
  [4, () => {
    const p = pick(PARTICIPANTS_DATA.filter(p => p.status === 'active'));
    if (!p) return;
    const newAdvisor = pick(ADVISORS.filter(a => a !== p.advisor));
    pushActivity(
      'Advisor reassigned',
      `${p.name} (${p.country}) · ${p.advisor || 'previous'} → ${newAdvisor} · workload rebalance`,
      '#06b6d4'
    );
  }],

  // ── Compliance flag raised
  [3, () => {
    const p = pick(PARTICIPANTS_DATA.filter(p => p.compliance < 70));
    if (!p) return;
    pushActivity(
      'Compliance flag raised',
      `${p.name} (${p.country}) · compliance score ${p.compliance}% · review recommended`,
      '#ef4444'
    );
    addAlert(`Compliance flag — ${p.name} (${p.country}) · score below threshold`, 'warning');
  }],

  // ── Leader compliance review
  [3, () => {
    const l = pick(LEADERS_DATA.filter(l => l.complianceScore < 75));
    if (!l) return;
    pushActivity(
      'Leader compliance review',
      `${l.name} (${l.country}) · score ${l.complianceScore}% · supervisor notified`,
      '#ef4444'
    );
  }],

  // ── Incentive payout processed
  [5, () => {
    const l = pick(LEADERS_DATA.filter(l => l.status === 'active' || l.status === 'certified'));
    if (!l) return;
    const amount = rand(200, 2500);
    pushActivity(
      'Incentive payout processed',
      `${l.name} (${l.country}) · $${amount.toLocaleString()} · cycle bonus · approved`,
      '#10b981'
    );
  }],

  // ── System: idle (no event)
  [15, () => {
    // deliberate no-op — keeps cadence realistic, not every tick produces activity
  }],

];

// Build flat weighted array for selection
const EVENT_POOL = [];
WEIGHTED_EVENTS.forEach(([weight, fn]) => {
  for (let i = 0; i < weight; i++) EVENT_POOL.push(fn);
});

// ─── ENGINE CONTROL ────────────────────────────────────────────────────────

// Realistic intervals: operators should feel the system breathe, not race
const SPEED_MAP = {
  low:    90000,  // 90 seconds — background monitoring mode
  medium: 40000,  // 40 seconds — normal operational cadence
  high:   18000,  // 18 seconds — accelerated demo mode (still credible)
};

function tick() {
  _state.tick += 1;

  // One event per tick — no bursts
  const fn = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  fn();

  // Passive KPI micro-drift (very slow, directional)
  if (_state.tick % 3 === 0) {
    _state.kpis.conversionRate = drift(_state.kpis.conversionRate, 62, 78, 0.1);
    _state.kpis.growthSignal   = drift(_state.kpis.growthSignal, 16, 28, 0.5);
  }

  notify();
}

export const simEngine = {
  start() {
    if (_state.running) return;
    _state.running = true;
    const ms = SPEED_MAP[_state.speed] ?? SPEED_MAP.medium;
    _state.intervalId = setInterval(tick, ms);
    notify();
  },

  pause() {
    if (!_state.running) return;
    _state.running = false;
    clearInterval(_state.intervalId);
    _state.intervalId = null;
    pushActivity('Simulation paused', 'Engine paused — state preserved', '#6b7280');
    notify();
  },

  resume() {
    if (!_state.running) simEngine.start();
  },

  setSpeed(speed) {
    const was = _state.running;
    if (was) { clearInterval(_state.intervalId); _state.intervalId = null; _state.running = false; }
    _state.speed = speed;
    if (was) simEngine.start();
    else notify();
  },

  reset() {
    simEngine.pause();
    _state.tick = 0;
    _state._pipeline = [];
    _state.alerts    = [];
    _state.kpis      = buildBaselineKpis();
    _state.activityLog = [
      { action: 'Baseline restored', detail: 'Simulation reset — original dataset loaded', time: 'Just now', color: '#3b82f6' },
    ];
    notify();
  },

  subscribe(fn) {
    _state._subscribers.add(fn);
    fn({ ..._state, kpis: { ..._state.kpis } });
    return () => _state._subscribers.delete(fn);
  },

  getState() { return _state; },
};

// ─── REACT HOOK ────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

export function useSimulation() {
  const [state, setState] = useState(() => ({ ..._state, kpis: { ..._state.kpis }, unifiedData: unifiedDataEngine }));
  useEffect(() => simEngine.subscribe(s => setState({ ...s, kpis: { ...s.kpis }, unifiedData: unifiedDataEngine })), []);
  return state;
}

// Export unified data access
export function getUnifiedData() {
  return unifiedDataEngine;
}