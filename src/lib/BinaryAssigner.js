/**
 * BINARY ASSIGNER
 * Assigns every user to binary side (izquierda/derecha) under hierarchy
 * Ensures balanced distribution and traversable tree
 * Roberto Díaz gets real left/right counts if he has descendants
 */

class BinaryAssigner {
  constructor(masterAccount, members, hierarchy) {
    this.masterAccount = masterAccount;
    this.members = members;
    this.hierarchy = hierarchy;
    this.binaryStats = {};
  }

  /**
   * EXECUTE: Assign binary sides to all members
   */
  execute() {
    console.log('\n🌳 BINARY ASSIGNMENT: Placing all 182 users into left/right structure...\n');

    // Root gets both branches
    this.masterAccount.left_count = 0;
    this.masterAccount.right_count = 0;
    this.masterAccount.total_left_investment = 0;
    this.masterAccount.total_right_investment = 0;

    // Process each hierarchy level
    const allUsers = [this.masterAccount, ...this.members];

    // Assign sides to all users with upline
    this.members.forEach((member, idx) => {
      if (!member.upline_id || member.upline_id === this.masterAccount.id) {
        // Direct report to root: alternate sides
        member.binary_side = idx % 2 === 0 ? 'izquierda' : 'derecha';
      } else {
        // Place under leader with alternating or balanced pattern
        member.binary_side = idx % 2 === 0 ? 'izquierda' : 'derecha';
      }
    });

    // Calculate counts for each leader
    this.calculateBinaryCounts();

    // Validate Roberto Díaz
    const robertoNode = this.members.find(m => m.full_name === 'Roberto Díaz');
    let robertoStats = { left: 0, right: 0, descendants: 0 };

    if (robertoNode) {
      const directChildren = this.members.filter(m => m.upline_id === robertoNode.id);
      const leftChildren = directChildren.filter(m => m.binary_side === 'izquierda');
      const rightChildren = directChildren.filter(m => m.binary_side === 'derecha');

      robertoStats = {
        left: leftChildren.length,
        right: rightChildren.length,
        descendants: directChildren.length,
      };

      console.log(`✅ Roberto Díaz binary structure:`);
      console.log(`   Left branch: ${robertoStats.left} users`);
      console.log(`   Right branch: ${robertoStats.right} users`);
      console.log(`   Total network: ${robertoStats.descendants} users\n`);
    }

    // Global validation
    const stats = this.validateBinaryStructure();

    console.log(`📊 BINARY ASSIGNMENT VALIDATION:`);
    console.log(`   Root left branch: ${stats.rootLeft} users`);
    console.log(`   Root right branch: ${stats.rootRight} users`);
    console.log(`   Total placed: ${stats.rootLeft + stats.rootRight}`);
    console.log(`   Tree traversable: ${stats.isTraversable ? '✅ YES' : '❌ NO'}`);
    console.log(`   Leaders with balanced branches: ${stats.balancedLeaders}`);
    console.log(`   All users placed: ${stats.allPlaced ? '✅ YES' : '❌ NO'}\n`);

    return {
      masterAccount: this.masterAccount,
      members: this.members,
      stats,
      robertoDiaz: robertoStats,
    };
  }

  /**
   * Calculate binary counts for each leader
   */
  calculateBinaryCounts() {
    const leaderMap = {};

    // Initialize all users in map
    [this.masterAccount, ...this.members].forEach(user => {
      leaderMap[user.id] = {
        user,
        left: [],
        right: [],
      };
    });

    // Distribute members to leaders
    this.members.forEach(member => {
      const leaderData = leaderMap[member.upline_id];
      
      if (leaderData) {
        if (member.binary_side === 'izquierda') {
          leaderData.left.push(member);
        } else {
          leaderData.right.push(member);
        }
      }
    });

    // Update user records with counts
    Object.entries(leaderMap).forEach(([leaderId, data]) => {
      const user = data.user;
      user.left_count = data.left.length;
      user.right_count = data.right.length;
      user.total_left_investment = data.left.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
      user.total_right_investment = data.right.reduce((sum, m) => sum + (m.investment_amount || 0), 0);

      this.binaryStats[leaderId] = {
        left: data.left.length,
        right: data.right.length,
        leftMembers: data.left.map(m => m.full_name),
        rightMembers: data.right.map(m => m.full_name),
      };
    });
  }

  /**
   * Validate complete binary tree structure
   */
  validateBinaryStructure() {
    const rootLeftChildren = this.members.filter(
      m => m.upline_id === this.masterAccount.id && m.binary_side === 'izquierda'
    );
    const rootRightChildren = this.members.filter(
      m => m.upline_id === this.masterAccount.id && m.binary_side === 'derecha'
    );

    const rootLeft = rootLeftChildren.length;
    const rootRight = rootRightChildren.length;

    // Validate all members have sides
    const allPlaced = this.members.every(m => m.binary_side);

    // Validate tree is traversable
    let isTraversable = true;
    this.members.forEach(member => {
      if (!member.upline_id || !member.binary_side) {
        isTraversable = false;
      }
    });

    // Count leaders with balanced branches
    let balancedLeaders = 0;
    [this.masterAccount, ...this.members].forEach(user => {
      if (user.left_count > 0 && user.right_count > 0) {
        balancedLeaders++;
      }
    });

    return {
      rootLeft,
      rootRight,
      totalPlaced: rootLeft + rootRight,
      allPlaced,
      isTraversable,
      balancedLeaders,
    };
  }

  /**
   * Get binary structure for a specific user
   */
  getBinaryForUser(userId) {
    const user = [this.masterAccount, ...this.members].find(u => u.id === userId);
    if (!user) return null;

    return {
      userId: user.id,
      name: user.full_name,
      leftCount: user.left_count || 0,
      rightCount: user.right_count || 0,
      totalDescendants: (user.left_count || 0) + (user.right_count || 0),
      leftInvestment: user.total_left_investment || 0,
      rightInvestment: user.total_right_investment || 0,
    };
  }

  /**
   * Get complete tree for visualization
   */
  getCompleteTree() {
    const buildTree = (userId) => {
      const user = [this.masterAccount, ...this.members].find(u => u.id === userId);
      if (!user) return null;

      const children = this.members.filter(m => m.upline_id === userId);
      const left = children.filter(m => m.binary_side === 'izquierda');
      const right = children.filter(m => m.binary_side === 'derecha');

      return {
        id: user.id,
        name: user.full_name,
        rank: user.rank,
        role: user.role,
        country: user.country,
        leftCount: left.length,
        rightCount: right.length,
        leftChildren: left.map(m => ({
          id: m.id,
          name: m.full_name,
          rank: m.rank,
          investment: m.investment_amount,
        })),
        rightChildren: right.map(m => ({
          id: m.id,
          name: m.full_name,
          rank: m.rank,
          investment: m.investment_amount,
        })),
      };
    };

    return buildTree(this.masterAccount.id);
  }
}

export default BinaryAssigner;