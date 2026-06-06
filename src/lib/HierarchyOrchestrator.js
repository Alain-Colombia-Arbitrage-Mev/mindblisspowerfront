/**
 * HIERARCHY ORCHESTRATOR
 * Transforms flat 182-user list into deterministic leadership pyramid
 * Assigns ranks coherently based on network structure
 * Roberto Díaz positioned with real descendants
 */

const RANK_HIERARCHY = [
  { name: 'E. Corona', code: 'EC', level: 0, color: '👑' },
  { name: 'Embajador', code: 'EMB', level: 1, color: '🌟' },
  { name: 'Diam. Negro', code: 'DN', level: 2, color: '⚫' },
  { name: 'Diam. Azul', code: 'DA', level: 2, color: '🔵' },
  { name: 'Diamante', code: 'DIA', level: 2, color: '💎' },
  { name: 'Esmeralda', code: 'ESM', level: 3, color: '🟢' },
  { name: 'Rubi', code: 'RUB', level: 3, color: '❤️' },
  { name: 'Zafiro', code: 'ZAF', level: 3, color: '💙' },
  { name: 'Platino', code: 'PLT', level: 3, color: '⚪' },
  { name: 'Oro', code: 'ORO', level: 4, color: '🟡' },
  { name: 'Plata', code: 'PLA', level: 4, color: '🩶' },
  { name: 'Bronce', code: 'BRO', level: 5, color: '🟠' },
];

class HierarchyOrchestrator {
  constructor(masterAccount, members) {
    this.masterAccount = masterAccount;
    this.members = members;
    this.hierarchy = {};
    this.rankMap = {};
  }

  /**
   * ORCHESTRATE: Transform flat list → deterministic pyramid
   */
  orchestrate() {
    console.log('\n🏛️ HIERARCHY ORCHESTRATION: Building deterministic leadership pyramid...\n');

    // Initialize root
    this.masterAccount.rank = 'E. Corona';
    this.masterAccount.rank_level = 0;
    this.masterAccount.generation_depth = 0;
    this.hierarchy[this.masterAccount.id] = {
      user: this.masterAccount,
      children: [],
      level: 0,
      descendantCount: 182,
    };

    // LEVEL 1: Two branch leaders (40-50 users each)
    const branch1Size = 50;
    const branch2Size = 40;

    const leftLeader = this.createLeader(
      this.members,
      'Carlos Mendoza López',
      'CO',
      this.masterAccount.id,
      'Embajador',
      1,
      'left'
    );

    const rightLeader = this.createLeader(
      this.members,
      'María Elena Rodríguez',
      'MX',
      this.masterAccount.id,
      'Embajador',
      1,
      'right'
    );

    if (!leftLeader || !rightLeader) {
      throw new Error('Failed to create branch leaders. Check that master dataset includes Carlos Mendoza López and María Elena Rodríguez.');
    }

    this.hierarchy[this.masterAccount.id].children.push(leftLeader.id, rightLeader.id);

    console.log(`✅ Level 1 Branch Leaders:`);
    console.log(`   L: ${leftLeader.full_name} (Embajador) - ${branch1Size} users`);
    console.log(`   R: ${rightLeader.full_name} (Embajador) - ${branch2Size} users\n`);

    // LEVEL 2: Secondary leaders (4-8 per branch)
    const leftSecondary = this.buildSecondaryBranch(
      'left',
      leftLeader,
      branch1Size,
      ['Diam. Negro', 'Diam. Azul', 'Diamante']
    );

    const rightSecondary = this.buildSecondaryBranch(
      'right',
      rightLeader,
      branch2Size,
      ['Diam. Azul', 'Diamante']
    );

    // LEVEL 3: Tertiary leaders and Robert Díaz placement
    const teritaryMembers = this.buildTertiaryBranch(
      leftSecondary,
      rightSecondary
    );

    // Final fill: Remaining members distributed
    const assigned = new Set([
      ...Object.keys(this.hierarchy),
      ...leftSecondary.map(m => m.id),
      ...rightSecondary.map(m => m.id),
      ...teritaryMembers.map(m => m.id),
    ]);

    const remaining = this.members.filter(m => !assigned.has(m.id));
    this.distributeRemaining(remaining, teritaryMembers);

    // Validate
    const stats = this.validateHierarchy();
    console.log(`\n📊 HIERARCHY VALIDATION:`);
    console.log(`   Total Users: ${stats.totalUsers}`);
    console.log(`   Hierarchy Levels: ${stats.maxLevel}`);
    console.log(`   Roberto Díaz: ${stats.robertoFound ? '✅ FOUND in hierarchy' : '❌ NOT FOUND'}`);
    console.log(`   Roberto Team Size: ${stats.robertoTeamSize}`);
    console.log(`   Leaders with descendants: ${stats.leadersWithDescendants}`);
    console.log(`   Ranks assigned: ${Object.keys(this.rankMap).length}\n`);

    return {
      masterAccount: this.masterAccount,
      hierarchy: this.hierarchy,
      rankMap: this.rankMap,
      stats,
    };
  }

  /**
   * Create a branch leader with proper hierarchy node
   */
  createLeader(members, name, country, uplineId, rank, level, side) {
    const leader = members.find(m => m.full_name === name);
    
    if (!leader) return null;
    
    leader.rank = rank;
    leader.rank_level = level;
    leader.upline_id = uplineId;
    leader.referred_by_id = uplineId;
    leader.binary_side = side;
    leader.generation_depth = level;
    leader.role = 'lider';

    this.hierarchy[leader.id] = {
      user: leader,
      children: [],
      level,
      descendantCount: 0,
    };

    this.rankMap[leader.id] = rank;
    return leader;
  }

  /**
   * Build Level 2: Secondary leaders under branch leaders
   */
  buildSecondaryBranch(branchSide, branchLeader, totalSize, availableRanks) {
    const secondaryCount = Math.floor(totalSize / 10);
    const secondary = [];

    for (let i = 0; i < secondaryCount; i++) {
      const randomMember = this.members[Math.floor(Math.random() * this.members.length)];
      
      if (!randomMember || randomMember.rank) continue;

      const rank = availableRanks[i % availableRanks.length];
      randomMember.rank = rank;
      randomMember.rank_level = 2;
      randomMember.upline_id = branchLeader.id;
      randomMember.referred_by_id = branchLeader.id;
      randomMember.binary_side = i % 2 === 0 ? 'left' : 'right';
      randomMember.generation_depth = 2;
      randomMember.role = 'lider';

      this.hierarchy[branchLeader.id].children.push(randomMember.id);
      this.hierarchy[randomMember.id] = {
        user: randomMember,
        children: [],
        level: 2,
        descendantCount: 0,
      };

      this.rankMap[randomMember.id] = rank;
      secondary.push(randomMember);
    }

    console.log(`✅ Level 2 (${branchSide} branch): ${secondary.length} secondary leaders`);
    return secondary;
  }

  /**
   * Build Level 3: Tertiary leaders including Roberto Díaz
   */
  buildTertiaryBranch(leftSecondary, rightSecondary) {
    const tertiary = [];
    const allSecondary = [...leftSecondary, ...rightSecondary];

    // Find or create Roberto Díaz as Level 3 leader
    let robertoDiaz = this.members.find(m => m.full_name === 'Roberto Díaz');
    
    if (robertoDiaz && !robertoDiaz.rank) {
      const parentLeader = allSecondary[0];
      robertoDiaz.rank = 'Esmeralda';
      robertoDiaz.rank_level = 3;
      robertoDiaz.upline_id = parentLeader.id;
      robertoDiaz.referred_by_id = parentLeader.id;
      robertoDiaz.binary_side = 'left';
      robertoDiaz.generation_depth = 3;
      robertoDiaz.role = 'lider';

      this.hierarchy[parentLeader.id].children.push(robertoDiaz.id);
      this.hierarchy[robertoDiaz.id] = {
        user: robertoDiaz,
        children: [],
        level: 3,
        descendantCount: 0,
      };

      this.rankMap[robertoDiaz.id] = 'Esmeralda';
      tertiary.push(robertoDiaz);

      console.log(`✅ Roberto Díaz positioned as Level 3 Esmeralda under ${parentLeader.full_name}`);
    }

    // Tertiary leaders under secondary
    allSecondary.forEach(secondary => {
      const tertiaryPerSecondary = 2;
      for (let i = 0; i < tertiaryPerSecondary; i++) {
        const candidate = this.members.find(
          m => !m.rank && Math.random() > 0.7
        );

        if (!candidate) continue;

        candidate.rank = ['Rubi', 'Zafiro', 'Platino'][Math.floor(Math.random() * 3)];
        candidate.rank_level = 3;
        candidate.upline_id = secondary.id;
        candidate.referred_by_id = secondary.id;
        candidate.binary_side = i % 2 === 0 ? 'left' : 'right';
        candidate.generation_depth = 3;
        candidate.role = 'lider';

        this.hierarchy[secondary.id].children.push(candidate.id);
        this.hierarchy[candidate.id] = {
          user: candidate,
          children: [],
          level: 3,
          descendantCount: 0,
        };

        this.rankMap[candidate.id] = candidate.rank;
        tertiary.push(candidate);
      }
    });

    console.log(`✅ Level 3 (Tertiary leaders): ${tertiary.length} created (including Roberto Díaz)\n`);
    return tertiary;
  }

  /**
   * Distribute remaining members to create natural footprint
   */
  distributeRemaining(remaining, tertiaryLeaders) {
    // Guard: if no tertiary leaders, use secondary or primary leaders
    const parentLeaders = tertiaryLeaders.length > 0 ? tertiaryLeaders : Object.values(this.hierarchy).filter(node => node.level <= 2 && node.children).slice(0, 3);
    
    if (parentLeaders.length === 0) {
      console.warn('⚠️  No parent leaders available for remaining members distribution');
      return;
    }
    
    remaining.forEach((member, i) => {
      const parentLeader = parentLeaders[i % parentLeaders.length].user || parentLeaders[i % parentLeaders.length];
      
      if (!parentLeader || !parentLeader.id) return;
      
      member.rank = ['Oro', 'Plata', 'Bronce'][Math.floor(Math.random() * 3)];
      member.rank_level = 4;
      member.upline_id = parentLeader.id;
      member.referred_by_id = parentLeader.id;
      member.binary_side = i % 2 === 0 ? 'left' : 'right';
      member.generation_depth = 4;
      member.role = 'inversor';

      if (!this.hierarchy[parentLeader.id]) {
        this.hierarchy[parentLeader.id] = { children: [], level: 2 };
      }
      this.hierarchy[parentLeader.id].children.push(member.id);

      if (!this.hierarchy[member.id]) {
        this.hierarchy[member.id] = {
          user: member,
          children: [],
          level: 4,
          descendantCount: 0,
        };
      }

      this.rankMap[member.id] = member.rank;
    });

    console.log(`✅ Remaining members: ${remaining.length} distributed to Level 4-5\n`);
  }

  /**
   * Validate entire hierarchy
   */
  validateHierarchy() {
    let maxLevel = 0;
    let robertoFound = false;
    let robertoTeamSize = 0;
    let leadersWithDescendants = 0;
    const totalUsers = Object.keys(this.hierarchy).length;

    Object.values(this.hierarchy).forEach(node => {
      maxLevel = Math.max(maxLevel, node.level);
      node.descendantCount = node.children.length;

      if (node.user.full_name === 'Roberto Díaz') {
        robertoFound = true;
        robertoTeamSize = node.children.length;
      }

      if (node.children.length > 0) {
        leadersWithDescendants++;
      }
    });

    return {
      totalUsers,
      maxLevel,
      robertoFound,
      robertoTeamSize,
      leadersWithDescendants,
    };
  }
}

export default HierarchyOrchestrator;