/**
 * RENDER LOCKING SYSTEM
 * Prevents placeholder rendering when source data exists
 * Enforces data-first rendering across all UI surfaces
 */

class RenderLockingSystem {
  constructor(validator) {
    this.validator = validator;
    this.lockedCards = new Set();
  }

  /**
   * Lock a card from rendering until source validation passes
   */
  lockCard(cardId, userId, requiredMetrics) {
    this.lockedCards.add({ cardId, userId, requiredMetrics, timestamp: Date.now() });
  }

  /**
   * Check if a card can render with given data
   */
  canRenderCard(cardId, userId, sourceData) {
    if (!sourceData) {
      return {
        canRender: false,
        status: 'NO_SOURCE_DATA',
        message: 'Datos en construcción',
      };
    }

    // Validate the source data
    const validation = this.validator.validateLeader(userId);

    if (!validation.canRender) {
      return {
        canRender: false,
        status: 'VALIDATION_FAILED',
        message: 'Datos en construcción',
        errors: validation.errors,
      };
    }

    return {
      canRender: true,
      status: 'VALIDATED',
      message: 'Data ready to render',
    };
  }

  /**
   * Get safe render values for a leader card
   * Returns actual values or "Datos en construcción" placeholders
   */
  getSafeLeaderCardValues(userId, integrityModel) {
    const descendants = integrityModel.network_nodes.filter(n => n.upline_id === userId);
    const descendants_count = descendants.length;

    // Metrics with enforcement
    const metrics = {
      redActiva: this.getSafeValue('Red Activa', descendants_count, descendants_count),
      lineaIzquierda: this.getSafeValue('Línea Izquierda', descendants.filter(n => n.side === 'left').length, descendants_count),
      lineaDerecha: this.getSafeValue('Línea Derecha', descendants.filter(n => n.side === 'right').length, descendants_count),
      referidosDirect: this.getSafeValue('Referidos Directos', descendants.filter(n => n.generation_depth === 1).length, descendants_count),
      generacionProfunda: this.getSafeValue('Generación Profunda', descendants_count, descendants_count),
    };

    return metrics;
  }

  /**
   * Get safe render value: enforces RULE that if source exists, value cannot be zero
   */
  getSafeValue(metricName, computedValue, sourceCount) {
    if (sourceCount > 0 && computedValue === 0) {
      console.warn(`🔒 RENDER LOCKED: ${metricName} = 0 but ${sourceCount} source records exist`);
      return {
        value: null,
        display: 'Datos en construcción',
        locked: true,
        reason: 'Zero placeholder blocked; source data exists',
      };
    }

    if (sourceCount === 0) {
      return {
        value: null,
        display: 'Datos en construcción',
        locked: false,
        reason: 'No source data yet',
      };
    }

    return {
      value: computedValue,
      display: computedValue,
      locked: false,
      reason: 'Valid computed value',
    };
  }

  /**
   * Get safe financial card values
   */
  getSafeFinancialValues(paymentRecords, sourceCount) {
    if (!paymentRecords || paymentRecords.length === 0) {
      return {
        confirmed: this.getSafeValue('Ingresos Confirmados', 0, 0),
        pending: this.getSafeValue('Pendientes', 0, 0),
        overdue: this.getSafeValue('Vencidos', 0, 0),
        review: this.getSafeValue('En Revisión', 0, 0),
      };
    }

    const confirmed = paymentRecords.filter(p => p.status === 'confirmado').reduce((s, p) => s + p.amount, 0);
    const pending = paymentRecords.filter(p => p.status === 'pendiente').reduce((s, p) => s + p.amount, 0);
    const overdue = paymentRecords.filter(p => p.status === 'vencido').reduce((s, p) => s + p.amount, 0);
    const review = paymentRecords.filter(p => p.status === 'en revisión').reduce((s, p) => s + p.amount, 0);

    return {
      confirmed: this.getSafeValue('Ingresos Confirmados', confirmed, sourceCount),
      pending: this.getSafeValue('Pendientes', pending, sourceCount),
      overdue: this.getSafeValue('Vencidos', overdue, sourceCount),
      review: this.getSafeValue('En Revisión', review, sourceCount),
    };
  }

  /**
   * Log render lock violations
   */
  reportViolation(cardName, userId, value, sourceCount) {
    console.error(
      `🚨 RENDER LOCK VIOLATION: ${cardName} (user: ${userId})\n` +
      `   Attempted value: ${value}\n` +
      `   Source records: ${sourceCount}\n` +
      `   Status: BLOCKED`
    );
  }
}

export default RenderLockingSystem;