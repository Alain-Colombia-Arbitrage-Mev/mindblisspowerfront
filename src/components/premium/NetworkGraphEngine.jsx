/**
 * NETWORK GRAPH ENGINE
 * Converts member network into visual graph data for D3/Vis.js rendering
 * 
 * Creates:
 * - Node objects with visual properties (size, color, icon)
 * - Edge objects connecting members
 * - Hierarchy levels
 * - Branch strength indicators
 */

import BinaryTreeCalculationEngine from '@/lib/BinaryTreeCalculationEngine';

class NetworkGraphEngine {
  /**
   * Generate nodes for network visualization
   */
  static generateNodes(members, networkNodes, binaryMetrics) {
    if (!Array.isArray(members)) return [];

    return members.map(member => {
      // Determine node size based on investment
      const sizeMultiplier = Math.max(1, Math.log(member.investment_amount + 1) / Math.log(10));
      const size = Math.max(20, Math.min(60, 20 + sizeMultiplier * 8));

      // Determine node color based on rank
      const rankColors = {
        'Principiante': '#6B7280',
        'Bronce': '#92400e',
        'Plata': '#374151',
        'Oro': '#d97706',
        'Platino': '#9333ea',
        'Zafiro': '#0369a1',
        'Rubí': '#dc2626',
        'Esmeralda': '#059669',
        'Diamante': '#4f46e5',
        'Diamante Azul': '#0ea5e9',
        'Diamante Negro': '#1f2937',
        'E. Corona': '#fbbf24',
      };

      const color = rankColors[member.rank] || '#93C5FD';

      // Determine status indicator
      const statusIndicator = member.status === 'active' ? '✓' : '○';

      // Determine if high-value
      const isHighValue = member.investment_amount >= 5000;

      return {
        id: member.user_id,
        label: member.full_name || 'Unknown',
        rank: member.rank,
        investment: member.investment_amount,
        email: member.email,
        phone: member.phone,
        country: member.country,
        status: member.status,
        side: member.binary_side,
        uplineId: member.upline_id,
        size: size,
        color: color,
        borderColor: isHighValue ? '#fbbf24' : color,
        borderWidth: isHighValue ? 3 : 2,
        fontColor: '#ffffff',
        icon: this.getRankIcon(member.rank),
        isHighValue: isHighValue,
        statusIndicator: statusIndicator,
        physics: true,
      };
    });
  }

  /**
   * Generate edges for network visualization
   */
  static generateEdges(members, networkNodes) {
    if (!Array.isArray(members) || !Array.isArray(networkNodes)) return [];

    const edges = [];

    networkNodes.forEach(node => {
      if (node.upline_id) {
        const uplineMember = members.find(m => m.user_id === node.upline_id);
        if (uplineMember) {
          const edgeColor = node.binary_side === 'left' ? '#06b6d4' : '#ec4899';
          
          edges.push({
            from: node.upline_id,
            to: node.user_id,
            color: { color: edgeColor, opacity: 0.4 },
            width: 2,
            arrows: 'to',
            smooth: { type: 'curvedCW', roundness: 0.5 },
            label: node.binary_side.toUpperCase(),
            font: { color: edgeColor, size: 10 },
          });
        }
      }
    });

    return edges;
  }

  /**
   * Get rank icon/emoji
   */
  static getRankIcon(rank) {
    const icons = {
      'Principiante': '🌱',
      'Bronce': '🥉',
      'Plata': '🥈',
      'Oro': '🥇',
      'Platino': '⭐',
      'Zafiro': '🔵',
      'Rubí': '❤️',
      'Esmeralda': '💚',
      'Diamante': '💎',
      'Diamante Azul': '💙',
      'Diamante Negro': '🖤',
      'E. Corona': '👑',
    };
    return icons[rank] || '👤';
  }

  /**
   * Calculate layout levels (hierarchy)
   */
  static calculateHierarchyLevels(members, networkNodes, rootId) {
    if (!Array.isArray(members) || !Array.isArray(networkNodes)) return {};

    const levels = { 0: [rootId] };
    let currentLevel = 0;
    const visited = new Set([rootId]);

    while (currentLevel < 10) {
      const nextLevel = [];
      const currentLevelMembers = levels[currentLevel] || [];

      currentLevelMembers.forEach(memberId => {
        const children = networkNodes.filter(n => n.upline_id === memberId);
        children.forEach(child => {
          if (!visited.has(child.user_id)) {
            visited.add(child.user_id);
            nextLevel.push(child.user_id);
          }
        });
      });

      if (nextLevel.length === 0) break;
      currentLevel++;
      levels[currentLevel] = nextLevel;
    }

    return levels;
  }

  /**
   * Get branch strength visualization data
   */
  static getBranchStrengthData(binaryMetrics) {
    if (!binaryMetrics) return null;

    return {
      left: {
        total: binaryMetrics.leftTotal,
        count: binaryMetrics.leftCount,
        average: binaryMetrics.leftCount > 0 ? Math.round(binaryMetrics.leftTotal / binaryMetrics.leftCount) : 0,
        width: binaryMetrics.leftTotal,
      },
      right: {
        total: binaryMetrics.rightTotal,
        count: binaryMetrics.rightCount,
        average: binaryMetrics.rightCount > 0 ? Math.round(binaryMetrics.rightTotal / binaryMetrics.rightCount) : 0,
        width: binaryMetrics.rightTotal,
      },
      balance: binaryMetrics.balance,
      isBalanced: binaryMetrics.isBalanced,
    };
  }

  /**
   * Get high-value nodes (top by investment)
   */
  static getHighValueNodes(members, limit = 10) {
    if (!Array.isArray(members)) return [];

    return members
      .sort((a, b) => b.investment_amount - a.investment_amount)
      .slice(0, limit)
      .map(m => ({
        user_id: m.user_id,
        name: m.full_name,
        investment: m.investment_amount,
        rank: m.rank,
      }));
  }

  /**
   * Get direct leaders (direct uplines)
   */
  static getDirectLeaders(members, userId) {
    if (!Array.isArray(members)) return [];

    const member = members.find(m => m.user_id === userId);
    if (!member || !member.upline_id) return [];

    const upline = members.find(m => m.user_id === member.upline_id);
    return upline ? [upline] : [];
  }
}

export default NetworkGraphEngine;