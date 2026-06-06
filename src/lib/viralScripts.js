/**
 * Vicion Power – Viral Narrative System
 * 15-30 second video scripts
 * 
 * Structure: Hook → Problem → Insight → Soft CTA
 * Rules: NO money, NO system explanation, NO promises
 * Goal: Curiosity → Click → Entry
 */

export const VIRAL_SCRIPTS = [
  {
    id: 'script_01',
    title: 'The Structure Paradox',
    duration: '20s',
    hook: 'Todos dicen "sé tú mismo" pero en realidad...',
    problem: 'Intentas ser diferente y terminas igual que todos.',
    insight: 'Porque no entiendes tu propia estructura.',
    cta: 'Hay algo que probablemente nunca consideraste.',
    platform: 'TikTok, Instagram Reels',
    vibe: 'Philosophical, eye-opening'
  },

  {
    id: 'script_02',
    title: 'The Timing Question',
    duration: '15s',
    hook: '¿Cómo sabes cuándo estás listo?',
    problem: 'Esperas el momento perfecto que nunca llega.',
    insight: 'El momento perfecto es ahora. Pero necesitas entender por qué.',
    cta: 'La razón está en esto...',
    platform: 'TikTok, YouTube Shorts',
    vibe: 'Introspective, motivational'
  },

  {
    id: 'script_03',
    title: 'The Network Effect',
    duration: '25s',
    hook: 'Crecimiento no significa más gente. Significa...',
    problem: 'Casi todos confunden volumen con valor.',
    insight: 'Lo que realmente importa es la estructura que creas.',
    cta: 'Hay un patrón que no ves.',
    platform: 'LinkedIn, TikTok',
    vibe: 'Professional, insightful'
  },

  {
    id: 'script_04',
    title: 'The Commitment Test',
    duration: '18s',
    hook: 'Si algo es gratis... probablemente no entiendas su valor.',
    problem: 'Buscas entrada fácil porque crees que eso significa oportunidad.',
    insight: 'Lo que requiere decisión real es lo que transforma.',
    cta: 'La pregunta real es: ¿estás dispuesto?',
    platform: 'TikTok, Instagram',
    vibe: 'Bold, confrontational'
  },

  {
    id: 'script_05',
    title: 'The Understanding Gap',
    duration: '22s',
    hook: 'Conocer algo vs entenderlo... son mundos distintos.',
    problem: 'Puedes saber los detalles pero seguir sin entender.',
    insight: 'Por eso la mayoría nunca avanza.',
    cta: 'Aquí es donde comienza la diferencia.',
    platform: 'All',
    vibe: 'Educational, mysterious'
  },

  {
    id: 'script_06',
    title: 'The Real Game',
    duration: '20s',
    hook: '¿Qué juego crees que estás jugando?',
    problem: 'La mayoría ni siquiera sabe que las reglas son diferentes.',
    insight: 'Porque nunca aprendieron a ver el tablero completo.',
    cta: 'El juego comienza aquí.',
    platform: 'TikTok, Instagram Reels',
    vibe: 'Mysterious, intriguing'
  },

  {
    id: 'script_07',
    title: 'The Community Myth',
    duration: '18s',
    hook: 'Comunidad... ¿o simbiosis?',
    problem: 'Confundes personas juntas con estructura real.',
    insight: 'Una es accidental. La otra es deliberada.',
    cta: 'Descubre cuál necesitas.',
    platform: 'LinkedIn, TikTok',
    vibe: 'Thought-provoking'
  },

  {
    id: 'script_08',
    title: 'The Evolution Path',
    duration: '25s',
    hook: 'Evolución no es conseguir más. Es...',
    problem: 'Buscas suma cuando lo que necesitas es transformación.',
    insight: 'Porque no conoces el patrón que genera ambos.',
    cta: 'Aquí comienza a tener sentido.',
    platform: 'All',
    vibe: 'Inspirational, profound'
  }
];

/**
 * Video Production Guidelines
 */
export const VIDEO_GUIDELINES = {
  visualStyle: {
    aesthetic: 'Minimalist, premium, high-contrast',
    colorPalette: ['#0F1419', '#1e40af', '#10b981', '#FFFFFF'],
    typography: 'Inter - bold, clean, readable at thumb-scroll speed',
    pacing: 'Fast cuts (0.5-2s per visual), no dead space'
  },

  hooks: [
    '❌ vs ✓ comparisons',
    'Rhetorical questions',
    'Bold statements followed by contradiction',
    'Common belief challenge',
    'Personal realization moment',
    'Pattern recognition intro'
  ],

  doNot: [
    '❌ Mention money, earnings, or financial benefits',
    '❌ Explain how the system works',
    '❌ Make promises or guarantees',
    '❌ Use testimonials or social proof',
    '❌ Show product/interface',
    '❌ Mention specific numbers',
    '❌ Address objections directly'
  ],

  do: [
    '✓ Create tension between statements',
    '✓ Appeal to identity / self-image',
    '✓ Trigger recognition ("That\'s me")',
    '✓ End with ambiguity that demands answers',
    '✓ Use philosophical framing',
    '✓ Reference internal transformation',
    '✓ Make viewer feel smart for understanding'
  ],

  callToAction: [
    'Aquí es donde comienza...',
    'La razón está en esto...',
    'Descubre cuál necesitas...',
    'Hay algo que probablemente nunca consideraste...',
    'El patrón que no ves...',
    'Esto cambia todo...',
    'El siguiente paso...'
  ]
};

/**
 * Content Pillars - What Makes It Viral
 */
export const CONTENT_PILLARS = {
  identity: {
    name: 'Identity & Self-Image',
    examples: [
      'Appeal to being "different"',
      'Challenge conventional thinking',
      'Position as insider knowledge',
      'Make viewer feel ahead of the curve'
    ]
  },

  curiosity: {
    name: 'Curiosity & Gap Creation',
    examples: [
      'Statement A contradicts Statement B',
      'End with unresolved tension',
      '"Everyone knows X, but actually Y"',
      'Leave the real answer off-screen'
    ]
  },

  philosophy: {
    name: 'Philosophical Depth',
    examples: [
      'Transformation, not acquisition',
      'Understanding vs knowing',
      'Structure vs chaos',
      'Real commitment vs convenience'
    ]
  },

  momentum: {
    name: 'Momentum & Belonging',
    examples: [
      'Something is happening right now',
      'You could be part of this',
      'Others are already choosing',
      'The moment is now'
    ]
  }
};

/**
 * Anti-Patterns - What Kills Viral Potential
 */
export const ANTI_PATTERNS = [
  'Too much text - keep it visual first',
  'Explaining benefits - create curiosity instead',
  'Slow pacing - content needs to move',
  'Generic motivation - be specific and uncommon',
  'Direct selling - invite discovery',
  'Showing the solution - never show the destination',
  'Being too polished - authenticity matters more'
];