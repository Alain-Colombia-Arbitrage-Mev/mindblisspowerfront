// Status & Reputation Engine for Mindbliss Power
// Prestige-based system measuring evolution, trust, and participation

export const STATUS_LEVELS = {
  explorer: {
    id: 1,
    name: 'Explorador',
    color: '#60a5fa',
    icon: 'compass',
    minScore: 0,
    maxScore: 19,
    meaning: 'Usuario recién activado, iniciando dentro del ecosistema',
  },
  active: {
    id: 2,
    name: 'Activo',
    color: '#1d6ef5',
    icon: 'zap',
    minScore: 20,
    maxScore: 39,
    meaning: 'Usuario que mantiene participación y ha comenzado su recorrido con claridad',
  },
  constant: {
    id: 3,
    name: 'Constante',
    color: '#06b6d4',
    icon: 'line',
    minScore: 40,
    maxScore: 59,
    meaning: 'Usuario que demuestra permanencia y continuidad dentro del sistema',
  },
  reliable: {
    id: 4,
    name: 'Confiable',
    color: '#10b981',
    icon: 'shield',
    minScore: 60,
    maxScore: 79,
    meaning: 'Usuario que avanza con cumplimiento, actividad y formación completada',
  },
  referent: {
    id: 5,
    name: 'Referente',
    color: '#f59e0b',
    icon: 'star',
    minScore: 80,
    maxScore: 94,
    meaning: 'Usuario visible dentro del ecosistema, con progreso consistente y presencia clara',
  },
  ambassador: {
    id: 6,
    name: 'Embajador',
    color: '#fbbf24',
    icon: 'crown',
    minScore: 95,
    maxScore: 100,
    meaning: 'Usuario con reputación alta, influencia positiva y desarrollo sólido dentro de la plataforma',
  },
};

export const STATUS_BENEFITS = {
  explorer: ['Acceso base al sistema', 'Seguimiento inicial de progreso'],
  active: ['Mejor visibilidad de progreso', 'Rutas sugeridas de aprendizaje'],
  constant: ['Prioridad en contenido', 'Más claridad de beneficios desbloqueables'],
  reliable: ['Reconocimiento visible en perfil', 'Acceso ampliado a recursos de acompañamiento'],
  referent: ['Distinción dentro del ranking', 'Visibilidad reforzada en la experiencia'],
  ambassador: ['Insignia premium', 'Reconocimiento destacado', 'Acceso preferente según disponibilidad del sistema'],
};

export function calculateReputationScore(userData) {
  let score = 0;

  // Account age: max 15 points (100 days = 15 points)
  if (userData.accountAgeInDays) {
    score += Math.min(15, Math.floor(userData.accountAgeInDays / 7));
  }

  // Email verification: 10 points
  if (userData.emailVerified) {
    score += 10;
  }

  // Account activation: 10 points
  if (userData.isActivated) {
    score += 10;
  }

  // Training modules completed: max 25 points (5 modules = 25 points)
  if (userData.trainingModulesCompleted) {
    score += Math.min(25, userData.trainingModulesCompleted * 5);
  }

  // Layer progression: max 15 points
  if (userData.currentLayer) {
    score += userData.currentLayer === 1 ? 5 : userData.currentLayer === 2 ? 10 : 15;
  }

  // Participation stability: max 10 points
  if (userData.monthsSinceActivation) {
    score += Math.min(10, Math.floor(userData.monthsSinceActivation * 1.5));
  }

  // Profile completeness: max 5 points
  if (userData.profileComplete) {
    score += 5;
  }

  // Benefits usage: max 5 points
  if (userData.hasUsedBenefits) {
    score += 5;
  }

  // Network development (Layer 3 only): max 5 points
  if (userData.currentLayer === 3 && userData.activeDirects) {
    score += Math.min(5, Math.floor(userData.activeDirects / 5));
  }

  // Behavioral compliance: max 5 points (simulated)
  if (userData.complianceScore) {
    score += Math.min(5, userData.complianceScore);
  }

  return Math.min(100, Math.max(0, Math.floor(score)));
}

export function getStatusFromScore(score) {
  const statuses = Object.entries(STATUS_LEVELS);
  const status = statuses.find(([_, level]) => score >= level.minScore && score <= level.maxScore);
  return status ? status[0] : 'explorer';
}

export function getNextStatusTarget(currentScore) {
  const currentStatus = getStatusFromScore(currentScore);
  const statuses = Object.keys(STATUS_LEVELS);
  const currentIndex = statuses.indexOf(currentStatus);
  
  if (currentIndex === statuses.length - 1) {
    return { name: 'Máximo', target: 100, remaining: 0 };
  }
  
  const nextStatus = statuses[currentIndex + 1];
  const target = STATUS_LEVELS[nextStatus].minScore;
  
  return {
    name: STATUS_LEVELS[nextStatus].name,
    target,
    remaining: Math.max(0, target - currentScore),
  };
}

export function getStatusProgressPercentage(score) {
  const status = getStatusFromScore(score);
  const level = STATUS_LEVELS[status];
  const range = level.maxScore - level.minScore;
  const progress = score - level.minScore;
  return Math.round((progress / range) * 100);
}

export function getStatusTimeline(userData) {
  const timeline = [];

  if (userData.accountCreatedDate) {
    timeline.push({
      type: 'account_created',
      label: 'Cuenta activada',
      date: userData.accountCreatedDate,
      icon: 'check-circle',
    });
  }

  if (userData.emailVerifiedDate) {
    timeline.push({
      type: 'email_verified',
      label: 'Correo verificado',
      date: userData.emailVerifiedDate,
      icon: 'mail-check',
    });
  }

  if (userData.trainingStartedDate) {
    timeline.push({
      type: 'training_started',
      label: 'Formación iniciada',
      date: userData.trainingStartedDate,
      icon: 'book-open',
    });
  }

  if (userData.trainingCompletedDate) {
    timeline.push({
      type: 'training_completed',
      label: 'Formación completada',
      date: userData.trainingCompletedDate,
      icon: 'award',
    });
  }

  if (userData.constructorActivatedDate) {
    timeline.push({
      type: 'constructor_mode',
      label: 'Modo constructor activado',
      date: userData.constructorActivatedDate,
      icon: 'layers',
    });
  }

  // Status milestone events
  if (userData.statusHistory && userData.statusHistory.length > 0) {
    userData.statusHistory.forEach(event => {
      timeline.push({
        type: 'status_change',
        label: `Nuevo estatus: ${event.statusName}`,
        date: event.date,
        icon: 'star',
      });
    });
  }

  return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
}