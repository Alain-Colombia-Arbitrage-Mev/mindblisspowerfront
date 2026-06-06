/**
 * VICION — Acquisition & Attribution Layer
 * Campaigns, referral chains, and conversion attribution.
 * Every participant traces back to a source. No orphan relationships.
 */

// ─── CAMPAIGNS ─────────────────────────────────────────────────────────────

export const CAMPAIGNS = [
  {
    id: 'CAM-001',
    name: 'Spring LATAM Expansion',
    channel: 'Meta Ads',
    objective: 'New registrations — MX / BR / CO markets',
    status: 'active',
    startDate: '2026-01-05',
    endDate: null,
    budget: 12000,
    spent: 8340,
    countries: ['MX', 'BR', 'CO', 'PE'],
    usersGenerated: 14,
    conversions: 11,
    investmentVolume: 68500,
    conversionRate: 78.6,
    cpa: 758,
    notes: 'Top performing LATAM campaign. MX leads outperforming BR.',
  },
  {
    id: 'CAM-002',
    name: 'TikTok Growth Wave Q1',
    channel: 'TikTok Ads',
    objective: 'Brand awareness + Gen Z acquisition — Global',
    status: 'active',
    startDate: '2026-02-01',
    endDate: null,
    budget: 8000,
    spent: 5120,
    countries: ['MX', 'CO', 'ES', 'IT', 'GH'],
    usersGenerated: 9,
    conversions: 5,
    investmentVolume: 18500,
    conversionRate: 55.6,
    cpa: 1024,
    notes: 'Good volume. Lower conversion rate — younger audience, longer decision cycle.',
  },
  {
    id: 'CAM-003',
    name: 'Google Discovery Europe',
    channel: 'Google Ads',
    objective: 'Intent-based acquisition — ES / IT / FR markets',
    status: 'active',
    startDate: '2025-12-10',
    endDate: null,
    budget: 15000,
    spent: 11200,
    countries: ['ES', 'IT', 'FR', 'BE', 'DE'],
    usersGenerated: 8,
    conversions: 7,
    investmentVolume: 54000,
    conversionRate: 87.5,
    cpa: 1600,
    notes: 'Highest conversion rate. Intent search drives quality leads. EU compliance validated.',
  },
  {
    id: 'CAM-004',
    name: 'Community Referral Drive',
    channel: 'Community Referral',
    objective: 'Leader-activated referral network expansion',
    status: 'active',
    startDate: '2026-01-10',
    endDate: null,
    budget: 5000,
    spent: 2100,
    countries: ['ALL'],
    usersGenerated: 22,
    conversions: 18,
    investmentVolume: 112000,
    conversionRate: 81.8,
    cpa: 117,
    notes: 'Most cost-efficient channel. Leader network drives highest LTV participants.',
  },
  {
    id: 'CAM-005',
    name: 'Africa Influencer Network',
    channel: 'Influencer Campaign',
    objective: 'GH + NG market penetration via trusted voices',
    status: 'active',
    startDate: '2026-02-15',
    endDate: null,
    budget: 6000,
    spent: 3800,
    countries: ['GH', 'NG', 'IN'],
    usersGenerated: 7,
    conversions: 5,
    investmentVolume: 28000,
    conversionRate: 71.4,
    cpa: 760,
    notes: 'Community trust factor high. Cash and mobile money routes require agent verification.',
  },
  {
    id: 'CAM-006',
    name: 'APAC Email Re-engagement',
    channel: 'Email Campaign',
    objective: 'Re-activate dormant leads — TW / IN markets',
    status: 'paused',
    startDate: '2026-01-20',
    endDate: '2026-03-15',
    budget: 2000,
    spent: 1950,
    countries: ['TW', 'IN'],
    usersGenerated: 5,
    conversions: 4,
    investmentVolume: 47500,
    conversionRate: 80.0,
    cpa: 488,
    notes: 'Completed. High ATV from APAC. Re-engagement email series drove 4 Elite/Premium conversions.',
  },
];

// ─── REFERRAL CHAINS ────────────────────────────────────────────────────────
// Parent-child relationships. referrerId → referred participant.
// Leaders (L-xxx) and participants (P-xxx) can both be referrers.

export const REFERRAL_CHAINS = [
  // ── Carlos López direct referrals (via L-001)
  { id: 'REF-001', referrerId: 'L-001', referrerName: 'Carlos López',  referrerType: 'leader',      referredId: 'P-10001', referredName: 'Alejandro Vega',     conversionStatus: 'converted', date: '2026-01-10', campaign: 'CAM-004' },
  { id: 'REF-002', referrerId: 'L-001', referrerName: 'Carlos López',  referrerType: 'leader',      referredId: 'P-10006', referredName: 'Sofía Morales',       conversionStatus: 'converted', date: '2026-01-28', campaign: 'CAM-004' },
  { id: 'REF-003', referrerId: 'L-001', referrerName: 'Carlos López',  referrerType: 'leader',      referredId: 'P-10010', referredName: 'Claudia Reyes',       conversionStatus: 'converted', date: '2025-11-15', campaign: 'CAM-004' },

  // ── Alejandro Vega downstream (P-10001) — 5 referrals
  { id: 'REF-004', referrerId: 'P-10001', referrerName: 'Alejandro Vega',   referrerType: 'participant', referredId: 'P-10003', referredName: 'Miguel Hernández',    conversionStatus: 'converted', date: '2026-02-01', campaign: null },
  { id: 'REF-005', referrerId: 'P-10001', referrerName: 'Alejandro Vega',   referrerType: 'participant', referredId: 'P-10005', referredName: 'Jorge Castillo',      conversionStatus: 'pending',   date: '2026-03-20', campaign: null },
  { id: 'REF-006', referrerId: 'P-10001', referrerName: 'Alejandro Vega',   referrerType: 'participant', referredId: 'P-10007', referredName: 'Raúl Espinoza',       conversionStatus: 'inactive',  date: '2025-12-10', campaign: null },
  { id: 'REF-007', referrerId: 'P-10001', referrerName: 'Alejandro Vega',   referrerType: 'participant', referredId: 'P-10008', referredName: 'Patricia Núñez',      conversionStatus: 'converted', date: '2026-02-22', campaign: 'CAM-001' },
  { id: 'REF-008', referrerId: 'P-10001', referrerName: 'Alejandro Vega',   referrerType: 'participant', referredId: 'P-10009', referredName: 'Daniel Flores',       conversionStatus: 'review',    date: '2026-03-05', campaign: null },

  // ── Claudia Reyes downstream (P-10010) — 7 referrals
  { id: 'REF-009', referrerId: 'P-10010', referrerName: 'Claudia Reyes',    referrerType: 'participant', referredId: 'P-10002', referredName: 'Laura Gutiérrez',     conversionStatus: 'converted', date: '2026-01-15', campaign: 'CAM-001' },
  { id: 'REF-010', referrerId: 'P-10010', referrerName: 'Claudia Reyes',    referrerType: 'participant', referredId: 'P-10004', referredName: 'Fernanda Ríos',       conversionStatus: 'converted', date: '2026-02-14', campaign: 'CAM-001' },
  { id: 'REF-011', referrerId: 'P-10010', referrerName: 'Claudia Reyes',    referrerType: 'participant', referredId: 'P-10022', referredName: 'Paola Restrepo',      conversionStatus: 'converted', date: '2026-02-20', campaign: null },
  { id: 'REF-012', referrerId: 'P-10010', referrerName: 'Claudia Reyes',    referrerType: 'participant', referredId: 'P-10023', referredName: 'Sebastián Mora',      conversionStatus: 'inactive',  date: '2026-01-12', campaign: null },
  { id: 'REF-013', referrerId: 'P-10010', referrerName: 'Claudia Reyes',    referrerType: 'participant', referredId: 'P-10024', referredName: 'Valentina Torres',    conversionStatus: 'pending',   date: '2026-03-25', campaign: 'CAM-002' },
  { id: 'REF-014', referrerId: 'P-10010', referrerName: 'Claudia Reyes',    referrerType: 'participant', referredId: 'P-10047', referredName: 'Luis Condori',        conversionStatus: 'converted', date: '2026-03-12', campaign: null },

  // ── Ana Silva network (L-002)
  { id: 'REF-015', referrerId: 'L-002', referrerName: 'Ana Silva',      referrerType: 'leader',      referredId: 'P-10011', referredName: 'Lucas Oliveira',      conversionStatus: 'converted', date: '2026-01-20', campaign: 'CAM-004' },
  { id: 'REF-016', referrerId: 'L-002', referrerName: 'Ana Silva',      referrerType: 'leader',      referredId: 'P-10016', referredName: 'Beatriz Rocha',       conversionStatus: 'converted', date: '2025-12-01', campaign: 'CAM-004' },

  // ── Beatriz Rocha downstream (P-10016) — 8 referrals
  { id: 'REF-017', referrerId: 'P-10016', referrerName: 'Beatriz Rocha',    referrerType: 'participant', referredId: 'P-10013', referredName: 'Rafael Costa',        conversionStatus: 'converted', date: '2026-01-30', campaign: 'CAM-001' },
  { id: 'REF-018', referrerId: 'P-10016', referrerName: 'Beatriz Rocha',    referrerType: 'participant', referredId: 'P-10014', referredName: 'Mariana Pereira',     conversionStatus: 'converted', date: '2026-02-18', campaign: null },
  { id: 'REF-019', referrerId: 'P-10016', referrerName: 'Beatriz Rocha',    referrerType: 'participant', referredId: 'P-10015', referredName: 'Thiago Almeida',     conversionStatus: 'pending',   date: '2026-03-15', campaign: null },
  { id: 'REF-020', referrerId: 'P-10016', referrerName: 'Beatriz Rocha',    referrerType: 'participant', referredId: 'P-10017', referredName: 'Eduardo Lima',        conversionStatus: 'converted', date: '2026-03-01', campaign: 'CAM-001' },
  { id: 'REF-021', referrerId: 'P-10016', referrerName: 'Beatriz Rocha',    referrerType: 'participant', referredId: 'P-10018', referredName: 'Camila Ferreira',     conversionStatus: 'blocked',   date: '2026-02-10', campaign: null },
  { id: 'REF-022', referrerId: 'P-10016', referrerName: 'Beatriz Rocha',    referrerType: 'participant', referredId: 'P-10035', referredName: 'Priya Nair',         conversionStatus: 'converted', date: '2026-02-14', campaign: 'CAM-006' },
  { id: 'REF-023', referrerId: 'P-10016', referrerName: 'Beatriz Rocha',    referrerType: 'participant', referredId: 'P-10036', referredName: 'Rahul Gupta',        conversionStatus: 'inactive',  date: '2025-12-20', campaign: 'CAM-006' },

  // ── Lucas Oliveira downstream (P-10011) — 6 referrals
  { id: 'REF-024', referrerId: 'P-10011', referrerName: 'Lucas Oliveira',   referrerType: 'participant', referredId: 'P-10012', referredName: 'Gabriela Santos',     conversionStatus: 'converted', date: '2026-02-05', campaign: null },
  { id: 'REF-025', referrerId: 'P-10011', referrerName: 'Lucas Oliveira',   referrerType: 'participant', referredId: 'P-10019', referredName: 'Andrés Vargas',       conversionStatus: 'converted', date: '2026-02-05', campaign: 'CAM-004' },
  { id: 'REF-026', referrerId: 'P-10011', referrerName: 'Lucas Oliveira',   referrerType: 'participant', referredId: 'P-10020', referredName: 'Natalia Giraldo',     conversionStatus: 'converted', date: '2026-01-25', campaign: null },

  // ── Isabella Moreno network (L-004)
  { id: 'REF-027', referrerId: 'L-004', referrerName: 'Isabella Moreno', referrerType: 'leader',      referredId: 'P-10025', referredName: 'Carlos Sánchez',      conversionStatus: 'converted', date: '2026-01-05', campaign: 'CAM-004' },
  { id: 'REF-028', referrerId: 'L-004', referrerName: 'Isabella Moreno', referrerType: 'leader',      referredId: 'P-10029', referredName: 'Javier López',        conversionStatus: 'converted', date: '2025-12-15', campaign: 'CAM-004' },

  // ── Carlos Sánchez downstream (P-10025) — 4 referrals
  { id: 'REF-029', referrerId: 'P-10025', referrerName: 'Carlos Sánchez',   referrerType: 'participant', referredId: 'P-10026', referredName: 'Elena Martínez',      conversionStatus: 'converted', date: '2026-02-10', campaign: null },
  { id: 'REF-030', referrerId: 'P-10025', referrerName: 'Carlos Sánchez',   referrerType: 'participant', referredId: 'P-10028', referredName: 'Ana Fernández',       conversionStatus: 'pending',   date: '2026-03-22', campaign: null },

  // ── Javier López downstream (P-10029) — 5 referrals
  { id: 'REF-031', referrerId: 'P-10029', referrerName: 'Javier López',     referrerType: 'participant', referredId: 'P-10027', referredName: 'Pablo García',        conversionStatus: 'converted', date: '2026-02-28', campaign: 'CAM-003' },
  { id: 'REF-032', referrerId: 'P-10029', referrerName: 'Javier López',     referrerType: 'participant', referredId: 'P-10050', referredName: 'Francesca Bruno',     conversionStatus: 'inactive',  date: '2026-01-28', campaign: 'CAM-003' },

  // ── Kevin Osei network (L-005) + downstream
  { id: 'REF-033', referrerId: 'L-005', referrerName: 'Kevin Osei',     referrerType: 'leader',      referredId: 'P-10030', referredName: 'Kwame Asante',        conversionStatus: 'converted', date: '2026-03-01', campaign: 'CAM-005' },
  { id: 'REF-034', referrerId: 'L-005', referrerName: 'Kevin Osei',     referrerType: 'leader',      referredId: 'P-10033', referredName: 'Efua Adjei',          conversionStatus: 'converted', date: '2026-02-18', campaign: 'CAM-005' },

  // ── Kwame Asante downstream (P-10030) — 2 referrals
  { id: 'REF-035', referrerId: 'P-10030', referrerName: 'Kwame Asante',     referrerType: 'participant', referredId: 'P-10031', referredName: 'Abena Mensah',        conversionStatus: 'converted', date: '2026-03-10', campaign: null },
  { id: 'REF-036', referrerId: 'P-10030', referrerName: 'Kwame Asante',     referrerType: 'participant', referredId: 'P-10032', referredName: 'Yaw Boateng',         conversionStatus: 'pending',   date: '2026-03-28', campaign: null },

  // ── James Okafor network (L-009)
  { id: 'REF-037', referrerId: 'L-009', referrerName: 'James Okafor',   referrerType: 'leader',      referredId: 'P-10038', referredName: 'Chidi Nwosu',         conversionStatus: 'converted', date: '2026-02-08', campaign: 'CAM-005' },
  { id: 'REF-038', referrerId: 'L-009', referrerName: 'James Okafor',   referrerType: 'leader',      referredId: 'P-10041', referredName: 'Amaka Onyekachi',     conversionStatus: 'converted', date: '2026-02-20', campaign: 'CAM-005' },

  // ── Chidi Nwosu downstream (P-10038) — 3 referrals
  { id: 'REF-039', referrerId: 'P-10038', referrerName: 'Chidi Nwosu',      referrerType: 'participant', referredId: 'P-10039', referredName: 'Ngozi Eze',           conversionStatus: 'converted', date: '2026-01-22', campaign: null },
  { id: 'REF-040', referrerId: 'P-10038', referrerName: 'Chidi Nwosu',      referrerType: 'participant', referredId: 'P-10040', referredName: 'Emeka Obi',           conversionStatus: 'pending',   date: '2026-03-18', campaign: null },

  // ── Mei Lin Chen network (L-010)
  { id: 'REF-041', referrerId: 'L-010', referrerName: 'Mei Lin Chen',   referrerType: 'leader',      referredId: 'P-10042', referredName: 'Wei-Ting Huang',      conversionStatus: 'converted', date: '2025-11-20', campaign: 'CAM-006' },
  { id: 'REF-042', referrerId: 'L-010', referrerName: 'Mei Lin Chen',   referrerType: 'leader',      referredId: 'P-10043', referredName: 'Shu-Fen Lin',         conversionStatus: 'converted', date: '2026-01-08', campaign: 'CAM-006' },

  // ── Wei-Ting Huang downstream (P-10042) — 8 referrals
  { id: 'REF-043', referrerId: 'P-10042', referrerName: 'Wei-Ting Huang',   referrerType: 'participant', referredId: 'P-10044', referredName: 'Jun-Yi Chang',        conversionStatus: 'converted', date: '2026-02-12', campaign: 'CAM-002' },
  { id: 'REF-044', referrerId: 'P-10042', referrerName: 'Wei-Ting Huang',   referrerType: 'participant', referredId: 'P-10034', referredName: 'Arjun Patel',         conversionStatus: 'converted', date: '2026-01-18', campaign: 'CAM-006' },
  { id: 'REF-045', referrerId: 'P-10042', referrerName: 'Wei-Ting Huang',   referrerType: 'participant', referredId: 'P-10037', referredName: 'Ananya Singh',        conversionStatus: 'converted', date: '2026-01-30', campaign: 'CAM-006' },

  // ── Priya Sharma network (L-006)
  { id: 'REF-046', referrerId: 'L-006', referrerName: 'Priya Sharma',   referrerType: 'leader',      referredId: 'P-10034', referredName: 'Arjun Patel',         conversionStatus: 'converted', date: '2026-01-18', campaign: 'CAM-004' },
  { id: 'REF-047', referrerId: 'L-006', referrerName: 'Priya Sharma',   referrerType: 'leader',      referredId: 'P-10037', referredName: 'Ananya Singh',        conversionStatus: 'converted', date: '2026-01-30', campaign: 'CAM-004' },

  // ── Valentina Cruz network (L-008)
  { id: 'REF-048', referrerId: 'L-008', referrerName: 'Valentina Cruz', referrerType: 'leader',      referredId: 'P-10045', referredName: 'Fernando Mendoza',    conversionStatus: 'converted', date: '2026-01-22', campaign: 'CAM-004' },
  { id: 'REF-049', referrerId: 'P-10045', referrerName: 'Fernando Mendoza', referrerType: 'participant', referredId: 'P-10046', referredName: 'Rosa Quispe',        conversionStatus: 'converted', date: '2026-02-08', campaign: null },

  // ── Roberto Díaz network (L-003)
  { id: 'REF-050', referrerId: 'L-003', referrerName: 'Roberto Díaz',  referrerType: 'leader',      referredId: 'P-10019', referredName: 'Andrés Vargas',       conversionStatus: 'converted', date: '2026-02-05', campaign: 'CAM-004' },
  { id: 'REF-051', referrerId: 'L-003', referrerName: 'Roberto Díaz',  referrerType: 'leader',      referredId: 'P-10020', referredName: 'Natalia Giraldo',     conversionStatus: 'converted', date: '2026-01-25', campaign: null },
];

// ─── ATTRIBUTION MAP ────────────────────────────────────────────────────────
// Maps every participant ID → { campaignId, referrerId, entryPoint, conversionStage }

const _convStage = (status, paymentStatus) => {
  if (status === 'active' && paymentStatus === 'verified') return 'investor';
  if (['active', 'paused'].includes(status)) return 'participant';
  if (status === 'pending_verification') return 'lead';
  return 'lead';
};

// Build referrer map from chains (referred → referrer)
const _referrerOf = {};
REFERRAL_CHAINS.forEach(r => { _referrerOf[r.referredId] = r; });

export const ATTRIBUTION_MAP = {
  // MX — Carlos López network
  'P-10001': { campaignId: 'CAM-004', referrerId: 'L-001', entryPoint: '/community-invite', conversionStage: 'investor', source: 'Referral' },
  'P-10002': { campaignId: 'CAM-001', referrerId: 'P-10010', entryPoint: '/meta-landing-mx', conversionStage: 'investor', source: 'Campaign' },
  'P-10003': { campaignId: null,      referrerId: 'P-10001', entryPoint: '/referral-link',   conversionStage: 'investor', source: 'Referral' },
  'P-10004': { campaignId: 'CAM-001', referrerId: 'P-10010', entryPoint: '/meta-landing-mx', conversionStage: 'investor', source: 'Campaign' },
  'P-10005': { campaignId: null,      referrerId: 'P-10001', entryPoint: '/referral-link',   conversionStage: 'lead',     source: 'Referral' },
  'P-10006': { campaignId: 'CAM-004', referrerId: 'L-001',   entryPoint: '/social-bio-link', conversionStage: 'investor', source: 'Social' },
  'P-10007': { campaignId: null,      referrerId: 'P-10001', entryPoint: '/referral-link',   conversionStage: 'lead',     source: 'Referral' },
  'P-10008': { campaignId: 'CAM-001', referrerId: 'P-10001', entryPoint: '/meta-landing-mx', conversionStage: 'investor', source: 'Campaign' },
  'P-10009': { campaignId: null,      referrerId: 'P-10001', entryPoint: '/referral-link',   conversionStage: 'lead',     source: 'Referral' },
  'P-10010': { campaignId: null,      referrerId: 'L-001',   entryPoint: '/direct',          conversionStage: 'investor', source: 'Organic' },

  // BR — Ana Silva network
  'P-10011': { campaignId: 'CAM-004', referrerId: 'L-002',   entryPoint: '/community-invite', conversionStage: 'investor', source: 'Referral' },
  'P-10012': { campaignId: null,      referrerId: 'P-10011', entryPoint: '/social-bio-link',  conversionStage: 'investor', source: 'Social' },
  'P-10013': { campaignId: 'CAM-001', referrerId: 'P-10016', entryPoint: '/meta-landing-br',  conversionStage: 'investor', source: 'Campaign' },
  'P-10014': { campaignId: null,      referrerId: 'P-10016', entryPoint: '/organic-search',   conversionStage: 'investor', source: 'Organic' },
  'P-10015': { campaignId: null,      referrerId: 'P-10016', entryPoint: '/referral-link',    conversionStage: 'lead',     source: 'Referral' },
  'P-10016': { campaignId: 'CAM-004', referrerId: 'L-002',   entryPoint: '/organic-search',   conversionStage: 'investor', source: 'Organic' },
  'P-10017': { campaignId: 'CAM-001', referrerId: 'P-10016', entryPoint: '/meta-landing-br',  conversionStage: 'investor', source: 'Campaign' },
  'P-10018': { campaignId: null,      referrerId: 'P-10016', entryPoint: '/referral-link',    conversionStage: 'lead',     source: 'Referral' },

  // CO — Roberto Díaz network
  'P-10019': { campaignId: 'CAM-004', referrerId: 'L-003',   entryPoint: '/community-invite', conversionStage: 'investor', source: 'Referral' },
  'P-10020': { campaignId: null,      referrerId: 'L-003',   entryPoint: '/social-bio-link',  conversionStage: 'investor', source: 'Social' },
  'P-10021': { campaignId: 'CAM-002', referrerId: null,       entryPoint: '/tiktok-landing',   conversionStage: 'lead',     source: 'Campaign' },
  'P-10022': { campaignId: null,      referrerId: 'P-10010', entryPoint: '/organic-search',   conversionStage: 'investor', source: 'Organic' },
  'P-10023': { campaignId: null,      referrerId: 'P-10010', entryPoint: '/referral-link',    conversionStage: 'lead',     source: 'Referral' },
  'P-10024': { campaignId: 'CAM-002', referrerId: 'P-10010', entryPoint: '/tiktok-landing',   conversionStage: 'lead',     source: 'Social' },

  // ES — Isabella Moreno network
  'P-10025': { campaignId: 'CAM-004', referrerId: 'L-004',   entryPoint: '/community-invite', conversionStage: 'investor', source: 'Referral' },
  'P-10026': { campaignId: null,      referrerId: 'P-10025', entryPoint: '/organic-search',   conversionStage: 'investor', source: 'Organic' },
  'P-10027': { campaignId: 'CAM-003', referrerId: 'P-10029', entryPoint: '/google-landing-eu',conversionStage: 'investor', source: 'Campaign' },
  'P-10028': { campaignId: null,      referrerId: 'P-10025', entryPoint: '/referral-link',    conversionStage: 'lead',     source: 'Referral' },
  'P-10029': { campaignId: 'CAM-004', referrerId: 'L-004',   entryPoint: '/direct',           conversionStage: 'investor', source: 'Organic' },

  // GH — Kevin Osei network
  'P-10030': { campaignId: 'CAM-005', referrerId: 'L-005',   entryPoint: '/influencer-link',  conversionStage: 'investor', source: 'Campaign' },
  'P-10031': { campaignId: null,      referrerId: 'P-10030', entryPoint: '/social-bio-link',  conversionStage: 'investor', source: 'Social' },
  'P-10032': { campaignId: 'CAM-002', referrerId: 'P-10030', entryPoint: '/tiktok-landing',   conversionStage: 'lead',     source: 'Campaign' },
  'P-10033': { campaignId: 'CAM-005', referrerId: 'L-005',   entryPoint: '/influencer-link',  conversionStage: 'investor', source: 'Campaign' },

  // IN — Priya Sharma network
  'P-10034': { campaignId: 'CAM-006', referrerId: 'P-10042', entryPoint: '/email-reengagement', conversionStage: 'investor', source: 'Campaign' },
  'P-10035': { campaignId: 'CAM-006', referrerId: 'P-10016', entryPoint: '/email-reengagement', conversionStage: 'investor', source: 'Campaign' },
  'P-10036': { campaignId: 'CAM-006', referrerId: 'P-10016', entryPoint: '/email-reengagement', conversionStage: 'lead',     source: 'Campaign' },
  'P-10037': { campaignId: 'CAM-006', referrerId: 'P-10042', entryPoint: '/email-reengagement', conversionStage: 'investor', source: 'Referral' },

  // NG — James Okafor network
  'P-10038': { campaignId: 'CAM-005', referrerId: 'L-009',   entryPoint: '/influencer-link',  conversionStage: 'investor', source: 'Campaign' },
  'P-10039': { campaignId: null,      referrerId: 'P-10038', entryPoint: '/social-bio-link',  conversionStage: 'investor', source: 'Social' },
  'P-10040': { campaignId: 'CAM-005', referrerId: 'P-10038', entryPoint: '/influencer-link',  conversionStage: 'lead',     source: 'Campaign' },
  'P-10041': { campaignId: 'CAM-005', referrerId: 'L-009',   entryPoint: '/influencer-link',  conversionStage: 'investor', source: 'Campaign' },

  // TW — Mei Lin Chen network
  'P-10042': { campaignId: 'CAM-006', referrerId: 'L-010',   entryPoint: '/email-reengagement', conversionStage: 'investor', source: 'Referral' },
  'P-10043': { campaignId: 'CAM-006', referrerId: 'L-010',   entryPoint: '/email-reengagement', conversionStage: 'investor', source: 'Social' },
  'P-10044': { campaignId: 'CAM-002', referrerId: 'P-10042', entryPoint: '/tiktok-landing',   conversionStage: 'investor', source: 'Campaign' },

  // PE — Valentina Cruz network
  'P-10045': { campaignId: 'CAM-004', referrerId: 'L-008',   entryPoint: '/community-invite', conversionStage: 'investor', source: 'Referral' },
  'P-10046': { campaignId: null,      referrerId: 'P-10045', entryPoint: '/organic-search',   conversionStage: 'investor', source: 'Organic' },
  'P-10047': { campaignId: null,      referrerId: 'P-10010', entryPoint: '/social-bio-link',  conversionStage: 'investor', source: 'Social' },

  // IT — Marco Bianchi network
  'P-10048': { campaignId: null,      referrerId: 'L-007',   entryPoint: '/referral-link',    conversionStage: 'lead',     source: 'Referral' },
  'P-10049': { campaignId: null,      referrerId: 'L-007',   entryPoint: '/referral-link',    conversionStage: 'lead',     source: 'Referral' },
  'P-10050': { campaignId: 'CAM-003', referrerId: 'P-10029', entryPoint: '/google-landing-eu',conversionStage: 'lead',     source: 'Campaign' },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

export function getAttribution(participantId) {
  return ATTRIBUTION_MAP[participantId] || { campaignId: null, referrerId: null, entryPoint: '/direct', conversionStage: 'lead', source: 'Organic' };
}

export function getCampaign(campaignId) {
  return CAMPAIGNS.find(c => c.id === campaignId) || null;
}

export function getReferralChain(participantId) {
  // Get all referrals this participant made
  return REFERRAL_CHAINS.filter(r => r.referrerId === participantId);
}

export function getReferredBy(participantId) {
  return REFERRAL_CHAINS.find(r => r.referredId === participantId) || null;
}

// Source breakdown aggregated across all participants
export function getSourceBreakdown() {
  const counts = {};
  const volume = {};
  Object.values(ATTRIBUTION_MAP).forEach(a => {
    counts[a.source] = (counts[a.source] || 0) + 1;
    volume[a.source] = (volume[a.source] || 0);
  });
  return Object.entries(counts).map(([source, count]) => ({
    source,
    count,
    pct: Math.round((count / Object.keys(ATTRIBUTION_MAP).length) * 100),
  }));
}

// Conversion funnel by source
export function getConversionBySource() {
  const map = {};
  Object.values(ATTRIBUTION_MAP).forEach(a => {
    if (!map[a.source]) map[a.source] = { total: 0, investors: 0, participants: 0, leads: 0 };
    map[a.source].total++;
    if (a.conversionStage === 'investor') map[a.source].investors++;
    else if (a.conversionStage === 'participant') map[a.source].participants++;
    else map[a.source].leads++;
  });
  return Object.entries(map).map(([source, d]) => ({
    source,
    ...d,
    conversionRate: Math.round((d.investors / d.total) * 100),
  }));
}

// Investment volume by acquisition source
export function getInvestmentBySource() {
  const map = {};
  // Use PARTICIPANTS_DATA via ATTRIBUTION_MAP
  // We'll compute from the attribution map entries
  Object.entries(ATTRIBUTION_MAP).forEach(([pid, attr]) => {
    if (!map[attr.source]) map[attr.source] = { source: attr.source, investors: 0, volume: 0, leads: 0 };
    if (attr.conversionStage === 'investor') {
      map[attr.source].investors++;
      // Estimate volume from campaign data or use a fixed proxy
      // Tie back to campaign investmentVolume proportionally
    }
    map[attr.source].leads++;
  });
  // Enrich with campaign investment volumes per source
  CAMPAIGNS.forEach(c => {
    const source = c.channel === 'Community Referral' ? 'Referral' :
      ['Meta Ads', 'TikTok Ads', 'Google Ads', 'Influencer Campaign', 'Email Campaign'].includes(c.channel) ? 'Campaign' : 'Organic';
    if (!map[source]) map[source] = { source, investors: 0, volume: 0, leads: 0 };
    map[source].volume = (map[source].volume || 0) + c.investmentVolume;
  });
  return Object.values(map).sort((a, b) => b.volume - a.volume);
}

// Leader performance ranked by referral output and conversion
export function getLeaderPerformance() {
  const map = {};
  REFERRAL_CHAINS.forEach(r => {
    // Find the root leader for each chain
    const leaderId = r.referrerType === 'leader' ? r.referrerId : null;
    if (!leaderId) return;
    if (!map[leaderId]) map[leaderId] = { id: leaderId, name: r.referrerName, referrals: 0, converted: 0, pending: 0, inactive: 0 };
    map[leaderId].referrals++;
    if (r.conversionStatus === 'converted') map[leaderId].converted++;
    else if (r.conversionStatus === 'pending') map[leaderId].pending++;
    else map[leaderId].inactive++;
  });
  return Object.values(map)
    .map(l => ({ ...l, convRate: l.referrals > 0 ? Math.round((l.converted / l.referrals) * 100) : 0 }))
    .sort((a, b) => b.converted - a.converted);
}

// Top referrers by number of downstream referrals
export function getTopReferrers() {
  const map = {};
  REFERRAL_CHAINS.forEach(r => {
    if (!map[r.referrerId]) map[r.referrerId] = { id: r.referrerId, name: r.referrerName, type: r.referrerType, total: 0, converted: 0 };
    map[r.referrerId].total++;
    if (r.conversionStatus === 'converted') map[r.referrerId].converted++;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}