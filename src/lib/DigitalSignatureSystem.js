// Digital Signature System - Simulates signing documents with verification and recording

class DigitalSignatureSystem {
  constructor() {
    this.signatures = [];
    this.signatureLog = [];
  }

  // Generate unique signature ID
  generateSignatureId() {
    return `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
  }

  // Generate signature hash (simulated cryptographic signature)
  generateSignatureHash(documentId, signer, timestamp) {
    const data = `${documentId}:${signer.id}:${signer.email}:${timestamp}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `0x${Math.abs(hash).toString(16).toUpperCase().padStart(16, '0')}`;
  }

  // Get device fingerprint (simulated)
  getDeviceFingerprint() {
    return {
      userAgent: navigator?.userAgent || 'Unknown',
      platform: navigator?.platform || 'Unknown',
      screenResolution: `${window?.innerWidth || 0}x${window?.innerHeight || 0}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      fingerprint: `FP-${Math.random().toString(36).substr(2, 16).toUpperCase()}`,
    };
  }

  // Get IP address (simulated)
  getClientIP() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  // Sign document
  signDocument(document, signer, acceptanceConfirmation = {}) {
    if (!document || !signer) {
      return { success: false, error: 'Missing document or signer information' };
    }

    const signatureId = this.generateSignatureId();
    const timestamp = new Date();
    const signatureHash = this.generateSignatureHash(document.id, signer, timestamp.getTime());
    const deviceInfo = this.getDeviceFingerprint();

    const signature = {
      id: signatureId,
      documentId: document.id,
      documentType: document.type,
      documentTitle: document.title,
      signer: {
        id: signer.id,
        name: signer.name,
        email: signer.email,
        role: signer.role || 'participant',
      },
      timestamp,
      signatureHash,
      deviceInfo,
      ipAddress: this.getClientIP(),
      acceptance: {
        acceptsTerms: acceptanceConfirmation.acceptsTerms || false,
        acceptsRisks: acceptanceConfirmation.acceptsRisks || false,
        acceptsConditions: acceptanceConfirmation.acceptsConditions || false,
        allAccepted: (acceptanceConfirmation.acceptsTerms && acceptanceConfirmation.acceptsRisks && acceptanceConfirmation.acceptsConditions) || false,
        confirmationTime: new Date(),
      },
      status: 'signed',
      isValid: true,
      verificationToken: `VER-${Math.random().toString(36).substr(2, 20).toUpperCase()}`,
    };

    this.signatures.push(signature);
    this.logSignatureEvent('document_signed', signature, document);

    return {
      success: true,
      signature,
      message: 'Document signed successfully',
    };
  }

  // Verify signature
  verifySignature(signatureId) {
    const signature = this.signatures.find(s => s.id === signatureId);
    if (!signature) {
      return { valid: false, error: 'Signature not found' };
    }

    return {
      valid: signature.isValid,
      signature,
      verifiedAt: new Date(),
      verificationResult: {
        hashValid: !!signature.signatureHash,
        timestampValid: !!signature.timestamp,
        signerValid: !!signature.signer.id,
        allValid: true,
      },
    };
  }

  // Get signature by ID
  getSignature(signatureId) {
    return this.signatures.find(s => s.id === signatureId);
  }

  // Get signatures for document
  getSignaturesForDocument(documentId) {
    return this.signatures.filter(s => s.documentId === documentId);
  }

  // Get signatures for signer
  getSignaturesForSigner(signerId) {
    return this.signatures.filter(s => s.signer.id === signerId);
  }

  // Log signature event
  logSignatureEvent(eventType, signature, document = null) {
    const logEntry = {
      id: `LOG-${Date.now()}`,
      eventType,
      signature: {
        id: signature.id,
        documentId: signature.documentId,
      },
      signer: signature.signer,
      timestamp: new Date(),
      details: {
        documentTitle: document?.title || signature.documentTitle,
        signerName: signature.signer.name,
        signerEmail: signature.signer.email,
        status: signature.status,
      },
    };

    this.signatureLog.push(logEntry);
    return logEntry;
  }

  // Invalidate signature
  invalidateSignature(signatureId, reason) {
    const signature = this.signatures.find(s => s.id === signatureId);
    if (!signature) return { success: false, error: 'Signature not found' };

    signature.isValid = false;
    signature.status = 'invalidated';
    signature.invalidationReason = reason;
    signature.invalidatedAt = new Date();

    this.logSignatureEvent('signature_invalidated', signature);
    return { success: true, signature };
  }

  // Get signature audit trail
  getAuditTrail(documentId = null) {
    let logs = this.signatureLog;

    if (documentId) {
      logs = logs.filter(l => l.signature.documentId === documentId);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get signature statistics
  getSignatureStats() {
    const totalSignatures = this.signatures.length;
    const validSignatures = this.signatures.filter(s => s.isValid).length;
    const invalidSignatures = this.signatures.filter(s => !s.isValid).length;

    const acceptanceBreakdown = {
      fullyAccepted: this.signatures.filter(s => s.acceptance.allAccepted).length,
      partiallyAccepted: this.signatures.filter(s => !s.acceptance.allAccepted && (s.acceptance.acceptsTerms || s.acceptance.acceptsRisks || s.acceptance.acceptsConditions)).length,
      notAccepted: this.signatures.filter(s => !s.acceptance.acceptsTerms && !s.acceptance.acceptsRisks && !s.acceptance.acceptsConditions).length,
    };

    return {
      totalSignatures,
      validSignatures,
      invalidSignatures,
      validityRate: totalSignatures > 0 ? ((validSignatures / totalSignatures) * 100).toFixed(2) + '%' : '0%',
      acceptanceBreakdown,
      signaturesByRole: this.getSignaturesByRole(),
      recentSignatures: this.signatures.slice(-10).map(s => ({
        id: s.id,
        signer: s.signer.name,
        documentTitle: s.documentTitle,
        timestamp: s.timestamp,
      })),
    };
  }

  // Get signatures grouped by role
  getSignaturesByRole() {
    const breakdown = {};
    this.signatures.forEach(sig => {
      const role = sig.signer.role || 'unknown';
      breakdown[role] = (breakdown[role] || 0) + 1;
    });
    return breakdown;
  }

  // Export signature proof
  exportSignatureProof(signatureId) {
    const signature = this.signatures.find(s => s.id === signatureId);
    if (!signature) return null;

    return {
      signatureId: signature.id,
      documentId: signature.documentId,
      documentTitle: signature.documentTitle,
      signer: signature.signer,
      timestamp: signature.timestamp.toISOString(),
      signatureHash: signature.signatureHash,
      status: signature.status,
      isValid: signature.isValid,
      acceptance: signature.acceptance,
      deviceInfo: signature.deviceInfo,
      ipAddress: signature.ipAddress,
      verificationToken: signature.verificationToken,
      exportedAt: new Date().toISOString(),
    };
  }

  // Batch sign documents
  batchSignDocuments(documents, signer, acceptanceConfirmation = {}) {
    const results = [];
    documents.forEach(doc => {
      const result = this.signDocument(doc, signer, acceptanceConfirmation);
      results.push({
        documentId: doc.id,
        success: result.success,
        signatureId: result.signature?.id,
      });
    });

    this.logSignatureEvent('batch_signing_completed', {
      id: `BATCH-${Date.now()}`,
      signer,
      count: results.length,
    });

    return {
      success: true,
      totalSigned: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results,
    };
  }
}

// Singleton instance
let signatureSystemInstance = null;

const digitalSignatureSystem = {
  getInstance: () => {
    if (!signatureSystemInstance) {
      signatureSystemInstance = new DigitalSignatureSystem();
    }
    return signatureSystemInstance;
  },

  signDocument: (document, signer, acceptance) => digitalSignatureSystem.getInstance().signDocument(document, signer, acceptance),
  verifySignature: (signatureId) => digitalSignatureSystem.getInstance().verifySignature(signatureId),
  getSignature: (signatureId) => digitalSignatureSystem.getInstance().getSignature(signatureId),
  getSignaturesForDocument: (documentId) => digitalSignatureSystem.getInstance().getSignaturesForDocument(documentId),
  getSignaturesForSigner: (signerId) => digitalSignatureSystem.getInstance().getSignaturesForSigner(signerId),
  invalidateSignature: (signatureId, reason) => digitalSignatureSystem.getInstance().invalidateSignature(signatureId, reason),
  getAuditTrail: (documentId) => digitalSignatureSystem.getInstance().getAuditTrail(documentId),
  getSignatureStats: () => digitalSignatureSystem.getInstance().getSignatureStats(),
  exportSignatureProof: (signatureId) => digitalSignatureSystem.getInstance().exportSignatureProof(signatureId),
  batchSignDocuments: (documents, signer, acceptance) => digitalSignatureSystem.getInstance().batchSignDocuments(documents, signer, acceptance),
  getAllSignatures: () => digitalSignatureSystem.getInstance().signatures,
};

export default digitalSignatureSystem;