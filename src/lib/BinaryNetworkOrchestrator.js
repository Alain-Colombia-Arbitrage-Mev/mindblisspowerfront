/**
 * BINARY NETWORK ORCHESTRATOR
 * Assigns 182 members to real binary locations under Roberto Díaz
 * Derives all metrics from actual member structure
 */

class BinaryNetworkOrchestrator {
  constructor(integrityModel, members) {
    this.model = integrityModel;
    this.members = members;
    this.networkStructure = {};
    this.metrics = {};
  }

  /**
   * PHASE 2: BINARY ASSIGNMENT
   * Assign each member to left or right under Roberto or subleaders
   */
  assignBinaryStructure() {
    console.log('🔗 Assigning binary structure with recursive hierarchy...');

    // Find Roberto Díaz as a tier-2 leader
    const roberto = this.members.find(m => m.full_name === 'Roberto Díaz');
    const masterUplineId = this.model.users[0]?.id; // Master account

    // Ensure Roberto is properly positioned under master
    if (roberto) {
      roberto.upline_id = masterUplineId;
      roberto.binary_side = 'left';
      roberto.generation_depth = 1;
    }

    // Separate members: Roberto + his team vs. others
    const robertoTeam = this.members.filter(m => m.full_name !== 'Roberto Díaz' && m.upline_id === roberto?.id).slice(0, 40);
    const otherMembers = this.members.filter(m => m.full_name !== 'Roberto Díaz' && !robertoTeam.includes(m));

    // Roberto's team: balance between left and right
    const midTeam = Math.floor(robertoTeam.length / 2);
    robertoTeam.slice(0, midTeam).forEach(member => {
      member.upline_id = roberto?.id;
      member.binary_side = 'left';
      member.generation_depth = 2;
    });
    robertoTeam.slice(midTeam).forEach(member => {
      member.upline_id = roberto?.id;
      member.binary_side = 'right';
      member.generation_depth = 2;
    });

    // Build deeper generations recursively under Roberto's team leads
    const robertoLeftLeads = robertoTeam.filter(m => m.binary_side === 'left').slice(0, 3);
    const robertoRightLeads = robertoTeam.filter(m => m.binary_side === 'right').slice(0, 3);
    let assignedToRoberto = robertoTeam.length;

    const deeperMembers = otherMembers.slice(0, Math.min(60, otherMembers.length));
    deeperMembers.forEach((member, idx) => {
      if (idx < 30) {
        const lead = robertoLeftLeads[idx % robertoLeftLeads.length];
        if (lead) {
          member.upline_id = lead.id;
          member.binary_side = idx % 2 === 0 ? 'left' : 'right';
          member.generation_depth = 3;
          assignedToRoberto++;
        }
      } else {
        const lead = robertoRightLeads[(idx - 30) % robertoRightLeads.length];
        if (lead) {
          member.upline_id = lead.id;
          member.binary_side = idx % 2 === 0 ? 'left' : 'right';
          member.generation_depth = 3;
          assignedToRoberto++;
        }
      }
    });

    // Remaining members: distribute under other tier-2 leaders
    const otherLeaders = this.members.filter(m => m.role === 'lider' && m.full_name !== 'Roberto Díaz').slice(0, 3);
    const remaining = this.members.filter(m => !m.upline_id || m.upline_id === undefined);
    
    remaining.forEach((member, idx) => {
      const leader = otherLeaders[idx % otherLeaders.length] || roberto;
      if (leader) {
        member.upline_id = leader.id;
        member.binary_side = idx % 2 === 0 ? 'left' : 'right';
        member.generation_depth = 2 + Math.floor(Math.random() * 2);
      }
    });

    console.log(`✅ Binary structure assigned: ${this.members.length} members, Roberto team: ${assignedToRoberto}`);
  }

  /**
   * RECURSIVE DESCENT: Count all descendants recursively
   */
  getRecursiveDescendants(parentId) {
    const direct = this.members.filter(m => m.upline_id === parentId);
    let total = [...direct];
    direct.forEach(member => {
      total = total.concat(this.getRecursiveDescendants(member.id));
    });
    return total;
  }

  /**
   * RECURSIVE BINARY COUNTS
   */
  getRecursiveSideCounts(parentId) {
    const descendants = this.getRecursiveDescendants(parentId);
    const left = descendants.filter(m => m.binary_side === 'left').length;
    const right = descendants.filter(m => m.binary_side === 'right').length;
    return { left, right, total: descendants.length };
  }

  /**
   * PHASE 3: COMPUTE BRANCH TOTALS (RECURSIVE)
   */
  computeBranchTotals() {
    const masterId = this.model.users[0]?.id;
    const sideCounts = this.getRecursiveSideCounts(masterId);

    this.metrics.leftCount = sideCounts.left;
    this.metrics.rightCount = sideCounts.right;
    this.metrics.totalMembers = sideCounts.total;

    console.log(`✅ RECURSIVE: Left: ${sideCounts.left}, Right: ${sideCounts.right}, Total: ${sideCounts.total} (must equal 182)`);
    return { leftCount: sideCounts.left, rightCount: sideCounts.right };
  }

  /**
   * PHASE 4: COMPUTE INVESTMENT TOTALS
   */
  computeInvestmentTotals() {
    const masterId = this.model.users[0]?.id;
    const descendants = this.getRecursiveDescendants(masterId);
    const leftMembers = descendants.filter(m => m.binary_side === 'left');
    const rightMembers = descendants.filter(m => m.binary_side === 'right');

    const leftInvestment = leftMembers.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const rightInvestment = rightMembers.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const networkInvestment = descendants.reduce((sum, m) => sum + (m.investment_amount || 0), 0);

    this.metrics.leftInvestment = leftInvestment;
    this.metrics.rightInvestment = rightInvestment;
    this.metrics.networkInvestment = networkInvestment;
    this.metrics.totalInvestment = networkInvestment;

    console.log(`✅ RECURSIVE Network Investment: $${networkInvestment}, Left: $${leftInvestment}, Right: $${rightInvestment}`);
    return { leftInvestment, rightInvestment, networkInvestment };
  }

  /**
   * PHASE 5: COMPUTE DIRECT REFERRALS
   */
  computeDirectReferrals(masterId) {
    const directReferrals = this.members.filter(m => m.upline_id === masterId && m.generation_depth === 1);
    this.metrics.directReferralCount = directReferrals.length;
    console.log(`✅ Direct referrals: ${directReferrals.length}`);
    return directReferrals;
  }

  /**
   * PHASE 6: COMPUTE DEEP GENERATION (RECURSIVE)
   */
  computeDeepGeneration(masterId) {
    const deepGeneration = this.getRecursiveDescendants(masterId);
    this.metrics.deepGeneration = deepGeneration.length;
    console.log(`✅ RECURSIVE Deep generation: ${deepGeneration.length}`);
    return deepGeneration;
  }

  /**
   * PHASE 7: SELECT SUBLEADERS
   */
  selectSubleaders() {
    // Select members with best metrics as subleaders
    const candidates = this.members
      .filter(m => m.generation_depth <= 2)
      .sort((a, b) => {
        const scoreA = a.investment_amount + (a.status === 'activo' ? 1000 : 0);
        const scoreB = b.investment_amount + (b.status === 'activo' ? 1000 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 8);

    candidates.forEach(member => {
      member.role = 'leader';
    });

    this.metrics.subleaders = candidates;
    console.log(`✅ Selected ${candidates.length} subleaders`);
    return candidates;
  }

  /**
   * PHASE 10: COMPUTE COMMISSION LEDGER
   */
  createCommissionLedger(master) {
    console.log('💰 Generating commission ledger...');

    const commissionEvents = [];
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const directReferrals = this.metrics.directReferrals || [];
    directReferrals.forEach(member => {
      const eventDate = new Date(thisMonth);
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 28));
      
      commissionEvents.push({
        id: `comm-${master.id}-${member.id}-direct`,
        leader_id: master.id,
        source_member_id: member.id,
        source_plan_value: member.investment_amount,
        event_type: 'bono_directo',
        event_amount: Math.round(member.investment_amount * 0.15),
        event_date: eventDate.toISOString(),
        status: 'completado',
      });
    });

    this.members.forEach(member => {
      if (member.payment_status === 'activo' || member.payment_status === 'completado') {
        const eventDate = new Date(thisMonth);
        eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 28));
        
        commissionEvents.push({
          id: `comm-${master.id}-${member.id}-binary`,
          leader_id: master.id,
          source_member_id: member.id,
          source_plan_value: member.investment_amount,
          event_type: 'bono_binario',
          event_amount: Math.round(member.investment_amount * 0.10),
          event_date: eventDate.toISOString(),
          status: 'completado',
        });
      }
    });

    (this.metrics.subleaders || []).forEach(subleader => {
      const teamMembers = this.members.filter(m => m.upline_id === subleader.id);
      const teamInvestment = teamMembers.reduce((sum, m) => sum + m.investment_amount, 0);
      
      if (teamInvestment > 0) {
        const eventDate = new Date(thisMonth);
        eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 28));
        
        commissionEvents.push({
          id: `comm-${master.id}-${subleader.id}-leadership`,
          leader_id: master.id,
          source_member_id: subleader.id,
          source_plan_value: teamInvestment,
          event_type: 'bono_liderazgo',
          event_amount: Math.round(teamInvestment * 0.05),
          event_date: eventDate.toISOString(),
          status: 'completado',
        });
      }
    });

    this.metrics.commissionEvents = commissionEvents;
    this.metrics.monthlyIncome = commissionEvents.reduce((sum, e) => sum + e.event_amount, 0);

    console.log(`✅ Created ${commissionEvents.length} commission events`);
    console.log(`✅ Monthly income for Roberto: $${this.metrics.monthlyIncome}`);

    return commissionEvents;
  }

  orchestrate(master) {
    this.assignBinaryStructure();
    this.computeBranchTotals();
    this.computeInvestmentTotals();
    this.metrics.directReferrals = this.computeDirectReferrals(master.id);
    this.metrics.deepGeneration = this.computeDeepGeneration(master.id).length;
    this.selectSubleaders();
    this.createCommissionLedger(master);

    return {
      metrics: this.metrics,
      members: this.members,
      summary: {
        redActiva: this.metrics.totalMembers,
        lineaIzquierda: this.metrics.leftCount,
        lineaDerechaCount: this.metrics.rightCount,
        referidosDirect: this.metrics.directReferrals.length,
        generacionProfunda: this.metrics.deepGeneration,
        inversionPersonal: master.investment_amount || 25000,
        inversionDeRed: this.metrics.networkInvestment,
        ingresosDelMes: this.metrics.monthlyIncome || 0,
      },
    };
  }
}

export default BinaryNetworkOrchestrator;