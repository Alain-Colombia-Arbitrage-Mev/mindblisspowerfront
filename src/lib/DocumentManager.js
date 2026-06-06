// Document Management System - Store, search, and manage all documents

class DocumentManager {
  constructor() {
    this.documents = [];
    this.searchIndex = [];
  }

  // Create document
  createDocument(docData) {
    if (!docData.title || !docData.type || !docData.category || !docData.content) {
      return { success: false, error: 'Missing required fields' };
    }

    const document = {
      id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ...docData,
      created_date: new Date(),
      generated_date: docData.generated_date || new Date(),
      status: docData.status || 'draft',
      version: docData.version || 1,
      view_count: 0,
      is_archived: false,
      tags: docData.tags || [],
    };

    this.documents.push(document);
    this.updateSearchIndex();

    return { success: true, document };
  }

  // Get document by ID
  getDocument(docId) {
    const doc = this.documents.find(d => d.id === docId);
    if (doc) {
      doc.view_count = (doc.view_count || 0) + 1;
    }
    return doc;
  }

  // Update document
  updateDocument(docId, updates) {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return { success: false, error: 'Document not found' };

    Object.assign(doc, updates, { updated_date: new Date() });
    this.updateSearchIndex();

    return { success: true, document: doc };
  }

  // Delete document
  deleteDocument(docId) {
    const index = this.documents.findIndex(d => d.id === docId);
    if (index === -1) return { success: false, error: 'Document not found' };

    this.documents.splice(index, 1);
    this.updateSearchIndex();

    return { success: true };
  }

  // Archive document
  archiveDocument(docId) {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return { success: false, error: 'Document not found' };

    doc.is_archived = true;
    doc.archived_date = new Date();

    return { success: true, document: doc };
  }

  // Search documents
  searchDocuments(query) {
    if (!query || query.trim().length === 0) {
      return this.documents.filter(d => !d.is_archived);
    }

    const lowerQuery = query.toLowerCase();
    return this.documents.filter(
      d =>
        !d.is_archived &&
        (d.title.toLowerCase().includes(lowerQuery) ||
          d.content.toLowerCase().includes(lowerQuery) ||
          d.participant_email?.toLowerCase().includes(lowerQuery) ||
          d.category.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter documents
  filterDocuments(filters) {
    let results = this.documents.filter(d => !d.is_archived);

    if (filters.type) {
      results = results.filter(d => d.type === filters.type);
    }

    if (filters.category) {
      results = results.filter(d => d.category === filters.category);
    }

    if (filters.status) {
      results = results.filter(d => d.status === filters.status);
    }

    if (filters.participant_id) {
      results = results.filter(d => d.participant_id === filters.participant_id);
    }

    if (filters.participant_email) {
      results = results.filter(d => d.participant_email === filters.participant_email);
    }

    if (filters.plan_id) {
      results = results.filter(d => d.plan_id === filters.plan_id);
    }

    if (filters.investment_id) {
      results = results.filter(d => d.investment_id === filters.investment_id);
    }

    if (filters.leader_id) {
      results = results.filter(d => d.leader_id === filters.leader_id);
    }

    if (filters.signed_only) {
      results = results.filter(d => d.status === 'signed' && d.signature_id);
    }

    if (filters.date_from) {
      results = results.filter(d => new Date(d.generated_date) >= new Date(filters.date_from));
    }

    if (filters.date_to) {
      results = results.filter(d => new Date(d.generated_date) <= new Date(filters.date_to));
    }

    return results;
  }

  // Get documents by participant
  getDocumentsByParticipant(participantId) {
    return this.documents.filter(d => d.participant_id === participantId && !d.is_archived);
  }

  // Get documents by plan
  getDocumentsByPlan(planId) {
    return this.documents.filter(d => d.plan_id === planId && !d.is_archived);
  }

  // Get documents by investment
  getDocumentsByInvestment(investmentId) {
    return this.documents.filter(d => d.investment_id === investmentId && !d.is_archived);
  }

  // Get documents by leader
  getDocumentsByLeader(leaderId) {
    return this.documents.filter(d => d.leader_id === leaderId && !d.is_archived);
  }

  // Get documents by type
  getDocumentsByType(type) {
    return this.documents.filter(d => d.type === type && !d.is_archived);
  }

  // Get documents by category
  getDocumentsByCategory(category) {
    return this.documents.filter(d => d.category === category && !d.is_archived);
  }

  // Get documents by status
  getDocumentsByStatus(status) {
    return this.documents.filter(d => d.status === status && !d.is_archived);
  }

  // Update document status
  updateDocumentStatus(docId, newStatus) {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return { success: false, error: 'Document not found' };

    doc.status = newStatus;
    doc.status_updated_date = new Date();

    return { success: true, document: doc };
  }

  // Link signature to document
  linkSignature(docId, signatureId, signedBy, signedDate) {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return { success: false, error: 'Document not found' };

    doc.signature_id = signatureId;
    doc.signed_by = signedBy;
    doc.signed_date = signedDate;
    doc.status = 'signed';

    return { success: true, document: doc };
  }

  // Get document statistics
  getStatistics() {
    const active = this.documents.filter(d => !d.is_archived);
    const byType = {};
    const byStatus = {};
    const byCategory = {};

    active.forEach(doc => {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    });

    return {
      totalDocuments: this.documents.length,
      activeDocuments: active.length,
      archivedDocuments: this.documents.filter(d => d.is_archived).length,
      byType,
      byStatus,
      byCategory,
      recentDocuments: active.sort((a, b) => new Date(b.generated_date) - new Date(a.generated_date)).slice(0, 10),
      mostViewed: active.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5),
      signedDocuments: active.filter(d => d.status === 'signed').length,
      pendingSignatures: active.filter(d => d.status === 'sent').length,
    };
  }

  // Update search index
  updateSearchIndex() {
    this.searchIndex = this.documents
      .filter(d => !d.is_archived)
      .map(d => ({
        id: d.id,
        title: d.title,
        type: d.type,
        category: d.category,
        participant: d.participant_email,
        status: d.status,
      }));
  }

  // Export document
  exportDocument(docId, format = 'json') {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return null;

    if (format === 'json') {
      return JSON.stringify(doc, null, 2);
    }

    if (format === 'text') {
      return `
DOCUMENT: ${doc.title}
TYPE: ${doc.type}
STATUS: ${doc.status}
GENERATED: ${doc.generated_date}
${doc.signed_date ? `SIGNED: ${doc.signed_date}` : ''}
---
${doc.content}
      `.trim();
    }

    return null;
  }

  // Get all documents (admin access)
  getAllDocuments(includeArchived = false) {
    return includeArchived ? this.documents : this.documents.filter(d => !d.is_archived);
  }

  // Bulk update status
  bulkUpdateStatus(docIds, newStatus) {
    const updated = [];
    docIds.forEach(id => {
      const result = this.updateDocumentStatus(id, newStatus);
      if (result.success) {
        updated.push(result.document);
      }
    });

    return { success: true, updated, count: updated.length };
  }

  // Get document by reference
  getDocumentsByReference(refType, refId) {
    const key = `${refType}_id`;
    return this.documents.filter(d => d[key] === refId && !d.is_archived);
  }
}

// Singleton instance
let documentManagerInstance = null;

const documentManager = {
  getInstance: () => {
    if (!documentManagerInstance) {
      documentManagerInstance = new DocumentManager();
    }
    return documentManagerInstance;
  },

  createDocument: (data) => documentManager.getInstance().createDocument(data),
  getDocument: (id) => documentManager.getInstance().getDocument(id),
  updateDocument: (id, updates) => documentManager.getInstance().updateDocument(id, updates),
  deleteDocument: (id) => documentManager.getInstance().deleteDocument(id),
  archiveDocument: (id) => documentManager.getInstance().archiveDocument(id),
  searchDocuments: (query) => documentManager.getInstance().searchDocuments(query),
  filterDocuments: (filters) => documentManager.getInstance().filterDocuments(filters),
  getDocumentsByParticipant: (id) => documentManager.getInstance().getDocumentsByParticipant(id),
  getDocumentsByPlan: (id) => documentManager.getInstance().getDocumentsByPlan(id),
  getDocumentsByInvestment: (id) => documentManager.getInstance().getDocumentsByInvestment(id),
  getDocumentsByLeader: (id) => documentManager.getInstance().getDocumentsByLeader(id),
  getStatistics: () => documentManager.getInstance().getStatistics(),
  getAllDocuments: (includeArchived) => documentManager.getInstance().getAllDocuments(includeArchived),
  getDocumentsByReference: (type, id) => documentManager.getInstance().getDocumentsByReference(type, id),
};

export default documentManager;