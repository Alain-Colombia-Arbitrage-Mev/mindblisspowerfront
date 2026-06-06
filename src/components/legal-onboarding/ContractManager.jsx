import { base44 } from '@/api/base44Client';

export class ContractManager {
  /**
   * Log contract acceptance with legal audit trail
   */
  static async logContractAcceptance(userId, contractData) {
    const timestamp = new Date().toISOString();
    const ipAddress = await this.getClientIp();
    
    const auditLog = {
      user_id: userId,
      timestamp,
      ip_address: ipAddress,
      country: await this.getCountry(),
      contract_version: '1.0',
      contract_hash: await this.hashDocument(contractData),
      acceptance_data: {
        terms: contractData.terms || true,
        nature: contractData.nature || true,
        risks: contractData.risks || true,
        permanence: contractData.permanence || true,
      },
      user_agent: navigator.userAgent,
    };

    try {
      // Store audit log (would be backend operation in production)
      localStorage.setItem(`contract_log_${userId}`, JSON.stringify(auditLog));
      console.log('Contract logged:', auditLog);
      return auditLog;
    } catch (error) {
      console.error('Failed to log contract:', error);
      throw error;
    }
  }

  /**
   * Generate PDF contract
   */
  static async generateContractPDF(userId, participationLevel, userEmail) {
    const timestamp = new Date().toISOString();
    
    const contractData = {
      user_id: userId,
      user_email: userEmail,
      participation_level: participationLevel,
      contract_version: '1.0',
      acceptance_date: timestamp,
      unique_id: `VICION-${userId}-${Date.now()}`,
    };

    // In production: call backend to generate PDF
    console.log('Contract PDF data prepared:', contractData);
    
    return contractData;
  }

  /**
   * Get client IP (mock for demo)
   */
  static async getClientIp() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get country (mock for demo)
   */
  static async getCountry() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return data.country_name;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Hash document for integrity verification
   */
  static async hashDocument(data) {
    const str = JSON.stringify(data);
    const encoder = new TextEncoder();
    const buffer = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Export contract log as JSON
   */
  static exportContractLog(userId) {
    const log = localStorage.getItem(`contract_log_${userId}`);
    if (!log) return null;

    const dataStr = JSON.stringify(JSON.parse(log), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contract_log_${userId}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Verify contract acceptance before action
   */
  static verifyContractAcceptance(userId) {
    const log = localStorage.getItem(`contract_log_${userId}`);
    if (!log) return false;

    try {
      const data = JSON.parse(log);
      return data.acceptance_data && 
             Object.values(data.acceptance_data).every(v => v === true);
    } catch {
      return false;
    }
  }

  /**
   * Get contract acceptance record
   */
  static getContractRecord(userId) {
    const log = localStorage.getItem(`contract_log_${userId}`);
    return log ? JSON.parse(log) : null;
  }
}