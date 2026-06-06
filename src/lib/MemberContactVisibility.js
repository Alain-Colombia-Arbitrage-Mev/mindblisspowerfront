/**
 * MEMBER CONTACT VISIBILITY CONTROL
 * Controlled exposure of contact information (email, phone) in member context only
 * 
 * Contact info is ONLY visible to leaders viewing their own network
 * NOT visible to admin (they have different access)
 * NOT visible publicly
 */

class MemberContactVisibility {
  /**
   * Check if a member can see contact info for another member
   * Only allowed if:
   * 1. They are viewing their own network
   * 2. The target member is in their network (downline/upline/sibling)
   */
  static canViewContactInfo(viewerId, targetMemberId, networkNodes) {
    if (!viewerId || !targetMemberId || !Array.isArray(networkNodes)) {
      return false;
    }

    // Cannot view own contact info (redundant)
    if (viewerId === targetMemberId) {
      return false;
    }

    // Check if target is in viewer's network
    return this.isInNetwork(viewerId, targetMemberId, networkNodes);
  }

  /**
   * Check if a member is in another member's network
   */
  static isInNetwork(rootMemberId, targetMemberId, networkNodes) {
    if (!rootMemberId || !targetMemberId || !Array.isArray(networkNodes)) {
      return false;
    }

    // Get all descendants of root
    const descendants = this.getAllDescendants(rootMemberId, networkNodes);
    return descendants.includes(targetMemberId);
  }

  /**
   * Get all descendants (both branches)
   */
  static getAllDescendants(rootMemberId, networkNodes, visitedSet = new Set()) {
    if (!rootMemberId || !Array.isArray(networkNodes)) {
      return [];
    }

    const descendants = [];
    const children = networkNodes.filter(n => n.upline_id === rootMemberId);

    children.forEach(child => {
      if (!visitedSet.has(child.user_id)) {
        visitedSet.add(child.user_id);
        descendants.push(child.user_id);

        const childDescendants = this.getAllDescendants(child.user_id, networkNodes, visitedSet);
        descendants.push(...childDescendants);
      }
    });

    return descendants;
  }

  /**
   * Get safe member data for network viewing
   * Includes contact info if viewer is authorized
   */
  static getSafeMemberData(member, viewerId, networkNodes) {
    if (!member) return null;

    const safe = {
      user_id: member.user_id,
      full_name: member.full_name || member.name,
      rank: member.rank,
      investment_amount: member.investment_amount,
      status: member.status,
      upline_id: member.upline_id,
      binary_side: member.binary_side,
      generation_depth: member.generation_depth,
    };

    // Only add contact info if authorized
    if (this.canViewContactInfo(viewerId, member.user_id, networkNodes)) {
      safe.email = member.email;
      safe.phone = member.phone;
      safe.country = member.country;
    }

    return safe;
  }

  /**
   * Filter members by contact info completeness
   */
  static getMembersWithoutContact(members, viewerId, networkNodes) {
    if (!Array.isArray(members)) return [];

    return members
      .filter(m => this.canViewContactInfo(viewerId, m.user_id, networkNodes))
      .filter(m => !m.email || !m.phone || !m.country)
      .map(m => ({
        user_id: m.user_id,
        name: m.full_name || m.name,
        missingFields: this.getMissingContactFields(m),
      }));
  }

  /**
   * Get list of missing contact fields
   */
  static getMissingContactFields(member) {
    const missing = [];
    if (!member.email) missing.push('email');
    if (!member.phone) missing.push('phone');
    if (!member.country) missing.push('country');
    return missing;
  }
}

export default MemberContactVisibility;