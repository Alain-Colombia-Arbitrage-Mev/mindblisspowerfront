/**
 * KYC Manager
 * Manages identity verification workflows for participants and leaders
 */

class KYCManager {
  constructor() {
    this.kycRecords = {}; // userId -> KYC record
    this.observers = [];
  }

  /**
   * Subscribe to KYC updates
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  notifyObservers(event) {
    this.observers.forEach(cb => cb(event));
  }

  /**
   * Create KYC record for new user
   */
  createKYCRecord(userId, userData = {}) {
    const record = {
      userId,
      fullName: userData.fullName || '',
      email: userData.email || '',
      country: userData.country || '',
      documentType: userData.documentType || 'PASSPORT', // PASSPORT, ID_CARD, DRIVER_LICENSE
      documentNumber: userData.documentNumber || '',
      status: userData.status || 'not_verified', // not_verified, pending, verified, rejected
      createdAt: Date.now(),
      updatedAt: Date.now(),
      submittedAt: null,
      verifiedAt: null,
      rejectedAt: null,
      approvedBy: null,
      rejectionReason: null,
      notes: [],
    };

    this.kycRecords[userId] = record;
    this.notifyObservers({ type: 'kyc_created', userId, record });
    return record;
  }

  /**
   * Get KYC record
   */
  getKYCRecord(userId) {
    if (!this.kycRecords[userId]) {
      this.createKYCRecord(userId);
    }
    return this.kycRecords[userId];
  }

  /**
   * Submit KYC for review
   */
  submitKYCForReview(userId, userData) {
    const record = this.getKYCRecord(userId);
    
    // Validate required fields
    if (!userData.fullName || !userData.email || !userData.country || !userData.documentType) {
      return { success: false, error: 'Missing required fields' };
    }

    record.fullName = userData.fullName;
    record.email = userData.email;
    record.country = userData.country;
    record.documentType = userData.documentType;
    record.documentNumber = userData.documentNumber || '';
    record.status = 'pending';
    record.submittedAt = Date.now();
    record.updatedAt = Date.now();
    record.notes.push({
      timestamp: Date.now(),
      type: 'submission',
      message: `KYC submitted - Document: ${userData.documentType}`,
    });

    this.notifyObservers({ type: 'kyc_submitted', userId, record });
    return { success: true, record };
  }

  /**
   * Approve KYC
   */
  approveKYC(userId, approverEmail) {
    const record = this.getKYCRecord(userId);
    if (record.status === 'verified') {
      return { success: false, error: 'Already verified' };
    }

    record.status = 'verified';
    record.verifiedAt = Date.now();
    record.approvedBy = approverEmail;
    record.updatedAt = Date.now();
    record.notes.push({
      timestamp: Date.now(),
      type: 'approved',
      message: `KYC approved by ${approverEmail}`,
    });

    this.notifyObservers({ type: 'kyc_approved', userId, record });
    return { success: true, record };
  }

  /**
   * Reject KYC
   */
  rejectKYC(userId, approverEmail, reason) {
    const record = this.getKYCRecord(userId);
    if (record.status === 'rejected') {
      return { success: false, error: 'Already rejected' };
    }

    record.status = 'rejected';
    record.rejectedAt = Date.now();
    record.rejectionReason = reason;
    record.updatedAt = Date.now();
    record.approvedBy = approverEmail;
    record.notes.push({
      timestamp: Date.now(),
      type: 'rejected',
      message: `KYC rejected: ${reason}`,
    });

    this.notifyObservers({ type: 'kyc_rejected', userId, record });
    return { success: true, record };
  }

  /**
   * Request review/resubmission
   */
  requestReview(userId, approverEmail, reason) {
    const record = this.getKYCRecord(userId);
    
    record.status = 'pending';
    record.updatedAt = Date.now();
    record.notes.push({
      timestamp: Date.now(),
      type: 'review_requested',
      message: `Review requested by ${approverEmail}: ${reason}`,
    });

    this.notifyObservers({ type: 'kyc_review_requested', userId, record });
    return { success: true, record };
  }

  /**
   * Get KYC status badge info
   */
  getStatusBadgeInfo(status) {
    const statusMap = {
      not_verified: { label: 'Not Verified', color: '#9ca3af', bgColor: '#9ca3af' },
      pending: { label: 'Pending Review', color: '#3b82f6', bgColor: '#3b82f6' },
      verified: { label: 'Verified', color: '#10b981', bgColor: '#10b981' },
      rejected: { label: 'Rejected', color: '#ef4444', bgColor: '#ef4444' },
    };
    return statusMap[status] || statusMap.not_verified;
  }

  /**
   * Get pending KYC reviews
   */
  getPendingReviews() {
    return Object.values(this.kycRecords)
      .filter(r => r.status === 'pending')
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }

  /**
   * Get KYC summary
   */
  getKYCSummary() {
    const records = Object.values(this.kycRecords);
    return {
      total: records.length,
      notVerified: records.filter(r => r.status === 'not_verified').length,
      pending: records.filter(r => r.status === 'pending').length,
      verified: records.filter(r => r.status === 'verified').length,
      rejected: records.filter(r => r.status === 'rejected').length,
    };
  }

  /**
   * Reset (testing only)
   */
  reset() {
    this.kycRecords = {};
  }
}

export default new KYCManager();