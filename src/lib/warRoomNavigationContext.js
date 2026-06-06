/**
 * WAR ROOM NAVIGATION STATE
 * Manages drill-down, breadcrumb trail, history stack, and upline traversal
 */

export class WarRoomNavigationState {
  constructor() {
    this.navigationStack = []; // [{id, name, rank, role}]
    this.currentNodeId = null;
    this.parentNodeId = null;
    this.rootNodeId = 'master-cuenta-mvp-principal';
  }

  // Initialize at root
  initRoot(rootNode) {
    this.rootNodeId = rootNode.id;
    this.navigationStack = [
      {
        id: rootNode.id,
        name: rootNode.name,
        rank: rootNode.rank,
        role: rootNode.role || 'root',
      }
    ];
    this.currentNodeId = rootNode.id;
    this.parentNodeId = null;
  }

  // Drill down into a node
  drillDown(node, parentId = null) {
    this.navigationStack.push({
      id: node.id,
      name: node.name,
      rank: node.rank,
      role: node.role || 'lider',
    });
    this.parentNodeId = parentId || this.currentNodeId;
    this.currentNodeId = node.id;
  }

  // Go up one level
  goUp() {
    if (this.navigationStack.length <= 1) return false;
    this.navigationStack.pop();
    const prevNode = this.navigationStack[this.navigationStack.length - 1];
    this.currentNodeId = prevNode.id;
    this.parentNodeId = this.navigationStack.length >= 2 
      ? this.navigationStack[this.navigationStack.length - 2].id 
      : null;
    return true;
  }

  // Return to root
  returnToRoot() {
    this.navigationStack = [this.navigationStack[0]];
    this.currentNodeId = this.rootNodeId;
    this.parentNodeId = null;
  }

  // Get breadcrumb path
  getBreadcrumb() {
    return this.navigationStack.map(node => ({
      id: node.id,
      name: node.name,
      rank: node.rank,
    }));
  }

  // Get current context
  getCurrentContext() {
    return {
      currentNodeId: this.currentNodeId,
      parentNodeId: this.parentNodeId,
      breadcrumb: this.getBreadcrumb(),
      depth: this.navigationStack.length,
      isRoot: this.currentNodeId === this.rootNodeId,
      canGoUp: this.navigationStack.length > 1,
    };
  }

  // Reset navigation
  reset() {
    this.navigationStack = [];
    this.currentNodeId = null;
    this.parentNodeId = null;
  }
}

// React hook for navigation
export function createWarRoomNavigation(rootNode) {
  const nav = new WarRoomNavigationState();
  if (rootNode) {
    nav.initRoot(rootNode);
  }
  return nav;
}