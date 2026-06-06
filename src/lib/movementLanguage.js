/**
 * Vicion Power - Movement Identity Language
 * Core terms that define our community narrative
 */

export const MOVEMENT_TERMS = {
  // Core identity replacements
  user: 'participante',
  users: 'participantes',
  client: 'miembro',
  clients: 'miembros',
  referred: 'parte del sistema',
  referral: 'crecimiento en red',
  recruit: 'invitar a participar',
  
  // Mindset phrases
  globalPhrase: 'Formas parte de una estructura diferente',
  tagline: 'No es un negocio. Es un movimiento.',
  mission: 'Construir redes globales de valor real',
  
  // Context-specific language
  joinedNetwork: 'Te has unido a la red',
  yourNetwork: 'Tu estructura',
  networkGrowth: 'Crecimiento de red',
  activeMembers: 'Miembros activos',
  teamStructure: 'Tu estructura',
  directInvites: 'Participantes invitados',
  
  // Benefits framing
  earnThrough: 'Genera valor a través de',
  participate: 'Participa en',
  contribute: 'Contribuye al',
  buildTogether: 'Construye con nosotros',
  growWith: 'Crece en comunidad',
  
  // System language
  activation: 'Activación de participante',
  member: 'Miembro',
  participant: 'Participante',
  leader: 'Líder de estructura',
  founder: 'Fundador de comunidad',
  
  // Call to action
  ctaJoin: 'Unirme al movimiento',
  ctaGrow: 'Hacer crecer mi estructura',
  ctaParticipate: 'Participar ahora'
};

export const MOVEMENT_MESSAGING = {
  hero: {
    main: 'No es un negocio. Es un movimiento.',
    sub: 'Formas parte de una estructura diferente'
  },
  
  network: {
    title: 'Tu estructura, tu comunidad',
    desc: 'Participa en el crecimiento de una red global'
  },
  
  benefits: {
    title: 'Genera valor genuino',
    desc: 'A través de participación activa en la comunidad'
  },
  
  growth: {
    title: 'Crece en comunidad',
    desc: 'Cada participante suma. Cada miembro importa.'
  }
};

/**
 * Utility function to get term in context
 */
export const getTerm = (key, context = 'default') => {
  return MOVEMENT_TERMS[key] || key;
};

/**
 * Utility function to inject global phrase contextually
 */
export const withMovementIdentity = (text) => {
  return `${text} ${MOVEMENT_TERMS.globalPhrase}`;
};