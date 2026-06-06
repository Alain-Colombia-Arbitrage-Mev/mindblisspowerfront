/**
 * MEMBER DATA ENRICHER
 * Batch enriches member data WITHOUT recalculating the entire network
 * 
 * Phase 1: Validate data completeness
 * Phase 2: Prepare missing fields
 * Phase 3: Mark for batch update (no immediate action)
 */

import RankGovernanceEngine from './RankGovernanceEngine';

class MemberDataEnricher {
  /**
   * Enrich a single member with missing fields
   * Does NOT modify the original; returns enriched copy
   */
  static enrichMember(member, defaults = {}) {
    if (!member) return null;

    const enriched = { ...member };

    // Fill missing required fields with defaults/placeholders
    enriched.full_name = enriched.full_name || enriched.name || defaults.name || 'Unknown Member';
    enriched.email = enriched.email || defaults.email || `${enriched.user_id}@member.local`;
    enriched.phone = enriched.phone || defaults.phone || '+971000000000';
    enriched.country = enriched.country || defaults.country || 'UAE';
    enriched.rank = RankGovernanceEngine.enforceRankCeiling(
      enriched.rank,
      enriched.user_id === defaults.rootMemberId
    );
    enriched.investment_amount = RankGovernanceEngine.validateInvestment(enriched.investment_amount || defaults.investment || 0);
    enriched.status = enriched.status || 'active';
    enriched.upline_id = enriched.upline_id || defaults.uplineId || null;
    enriched.binary_side = enriched.binary_side || defaults.binarySide || 'left';
    enriched.generation_depth = enriched.generation_depth || defaults.generationDepth || 0;

    // Mark as enriched
    enriched._enriched = true;
    enriched._isDataComplete = RankGovernanceEngine.isDataComplete(enriched);

    return enriched;
  }

  /**
   * Get members that need enrichment (batch report, no modification)
   */
  static getBatchEnrichmentReport(members = []) {
    if (!Array.isArray(members)) return { needsEnrichment: [], complete: [] };

    const needsEnrichment = [];
    const complete = [];

    members.forEach(member => {
      if (RankGovernanceEngine.isDataComplete(member)) {
        complete.push(member.user_id || member.id);
      } else {
        needsEnrichment.push({
          userId: member.user_id || member.id,
          name: member.full_name || member.name || 'Unknown',
          missingFields: this.getMissingFields(member),
        });
      }
    });

    return {
      needsEnrichment,
      complete,
      totalIncomplete: needsEnrichment.length,
      totalComplete: complete.length,
      readyForBatchUpdate: needsEnrichment.length > 0,
    };
  }

  /**
   * Get list of missing fields for a member
   */
  static getMissingFields(member) {
    const missing = [];
    if (!member.full_name && !member.name) missing.push('name');
    if (!member.email) missing.push('email');
    if (!member.phone) missing.push('phone');
    if (!member.investment_amount) missing.push('investment_amount');
    return missing;
  }

  /**
   * Generate enrichment instructions (for admin batch operations)
   * Do NOT apply; just prepare instructions
   */
  static generateEnrichmentInstructions(members = [], defaults = {}) {
    const instructions = {
      timestamp: new Date().toISOString(),
      totalMembers: members.length,
      enrichmentBatches: [],
    };

    members.forEach((member, idx) => {
      if (!RankGovernanceEngine.isDataComplete(member)) {
        const batch = {
          batchId: `batch-${Math.ceil((idx + 1) / 50)}`, // Group in batches of 50
          memberId: member.user_id || member.id,
          enrichments: {},
        };

        if (!member.full_name && !member.name) {
          batch.enrichments.full_name = defaults.nameTemplate?.replace('{id}', member.user_id) || 'Member ' + member.user_id;
        }
        if (!member.email) {
          batch.enrichments.email = defaults.emailTemplate?.replace('{id}', member.user_id) || `${member.user_id}@member.local`;
        }
        if (!member.phone) {
          batch.enrichments.phone = defaults.phone || '+971000000000';
        }
        if (!member.investment_amount) {
          batch.enrichments.investment_amount = defaults.investment || 0;
        }

        instructions.enrichmentBatches.push(batch);
      }
    });

    return instructions;
  }

  /**
   * Count members by completion status (for dashboard display)
   */
  static getCompletionStats(members = []) {
    const stats = {
      total: members.length,
      complete: 0,
      incomplete: 0,
      missingName: 0,
      missingEmail: 0,
      missingPhone: 0,
      missingInvestment: 0,
    };

    members.forEach(m => {
      if (RankGovernanceEngine.isDataComplete(m)) {
        stats.complete++;
      } else {
        stats.incomplete++;
        if (!m.full_name && !m.name) stats.missingName++;
        if (!m.email) stats.missingEmail++;
        if (!m.phone) stats.missingPhone++;
        if (!m.investment_amount) stats.missingInvestment++;
      }
    });

    stats.completionPercent = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

    return stats;
  }
}

export default MemberDataEnricher;