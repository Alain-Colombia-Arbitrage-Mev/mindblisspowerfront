// Simulated backend responses with realistic delays and variability
// Real-world microservice behavior

export const simulatedApi = {
  // STATE 1: Register
  async register(email, nombre, password) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      success: true,
      userId: 'USR_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      email,
      message: 'Cuenta creada correctamente',
      timestamp: new Date().toISOString(),
    };
  },

  // STATE 2: Email Verification
  async verifyEmail(code) {
    await new Promise(r => setTimeout(r, 800));
    if (code === '123456') {
      return {
        success: true,
        message: 'Correo verificado correctamente',
        verifiedAt: new Date().toISOString(),
      };
    }
    return {
      success: false,
      message: 'Código inválido. Intenta nuevamente.',
    };
  },

  async sendVerificationCode(email) {
    await new Promise(r => setTimeout(r, 600));
    return {
      success: true,
      message: `Código de verificación enviado a ${email}`,
      expiresIn: 600,
      testCode: '123456', // for demo
    };
  },

  // STATE 3: Activation Intent
  async selectParticipationType(userId, type) {
    await new Promise(r => setTimeout(r, 900));
    return {
      success: true,
      userId,
      participationType: type,
      message: 'Tipo de participación registrado',
      timestamp: new Date().toISOString(),
    };
  },

  // STATE 4-5: Plan Selection & Payment
  async processPlanSelection(userId, planName) {
    await new Promise(r => setTimeout(r, 700));
    return {
      success: true,
      userId,
      plan: planName,
      price: { Start: 500, Growth: 1000, Advance: 2500, Pro: 5000, Elite: 25000 }[planName],
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };
  },

  async processPayment(cardData) {
    await new Promise(r => setTimeout(r, 2500));
    
    // Simulate realistic scenarios
    const random = Math.random();
    
    if (random < 0.7) {
      // 70% approved
      return {
        success: true,
        status: 'approved',
        transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        message: 'Pago confirmado',
        timestamp: new Date().toISOString(),
      };
    } else if (random < 0.9) {
      // 20% under review
      return {
        success: true,
        status: 'review',
        transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        message: 'Tu operación está siendo validada por seguridad',
        timestamp: new Date().toISOString(),
      };
    } else {
      // 10% error
      return {
        success: false,
        status: 'declined',
        message: 'Tarjeta rechazada. Intenta con otro método.',
        timestamp: new Date().toISOString(),
      };
    }
  },

  // STATE 6: Approval Review
  async checkApprovalStatus(userId) {
    await new Promise(r => setTimeout(r, Math.random() * 3000 + 2000)); // 2-5s
    return {
      success: true,
      userId,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      message: 'Acceso activado correctamente',
    };
  },

  // STATE 7: Layer 1 - Basic Member
  async activateLayer1(userId) {
    await new Promise(r => setTimeout(r, 1000));
    return {
      success: true,
      userId,
      layer: 1,
      status: 'active',
      activatedAt: new Date().toISOString(),
      modules: ['overview', 'benefits', 'status'],
    };
  },

  // STATE 8: Layer 2 - Training
  async completeTrainingModule(userId, moduleId) {
    await new Promise(r => setTimeout(r, 600));
    return {
      success: true,
      userId,
      moduleId,
      completedAt: new Date().toISOString(),
      progress: Math.floor(Math.random() * 30) + 40,
    };
  },

  async activateLayer2(userId) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      success: true,
      userId,
      layer: 2,
      status: 'training_mode',
      activatedAt: new Date().toISOString(),
      message: 'Modo crecimiento activado',
    };
  },

  // STATE 9: Layer 3 - Full System
  async activateLayer3(userId) {
    await new Promise(r => setTimeout(r, 1500));
    return {
      success: true,
      userId,
      layer: 3,
      status: 'constructor',
      activatedAt: new Date().toISOString(),
      message: 'Sistema completo desbloqueado',
    };
  },

  // Generic utilities
  async emailNotification(email, type) {
    await new Promise(r => setTimeout(r, 400));
    return {
      success: true,
      email,
      type,
      sentAt: new Date().toISOString(),
    };
  },
};

export default simulatedApi;