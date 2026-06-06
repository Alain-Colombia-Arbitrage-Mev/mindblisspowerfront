// API Simulator - Prepares platform for real integrations
// Simulates API behavior with success/error/pending states, realistic delays, and error scenarios

class APISimulator {
  constructor() {
    this.responseDelay = 800; // ms - simulates network latency
    this.errorRate = 0.15; // 15% error chance for demo purposes
    this.requestLog = [];
    this.subscribers = [];
  }

  // Simulate API call with realistic behavior
  async simulateAPICall(endpoint, method = 'GET', data = null, options = {}) {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const startTime = Date.now();

    // Log request
    const request = {
      id: requestId,
      endpoint,
      method,
      data,
      timestamp: new Date(),
      status: 'pending',
    };
    this.requestLog.push(request);
    this.notifySubscribers({ type: 'request_start', request });

    // Simulate network delay
    await this.delay(options.delay || this.responseDelay);

    // Determine response type
    const errorChance = Math.random();
    let response = null;

    if (errorChance < this.errorRate && options.allowError !== false) {
      response = this.generateErrorResponse(endpoint, method, requestId);
    } else {
      response = this.generateSuccessResponse(endpoint, method, data, requestId);
    }

    // Update request status
    request.status = response.success ? 'success' : 'error';
    request.duration = Date.now() - startTime;
    request.response = response;

    this.notifySubscribers({ type: 'request_end', request });

    return response;
  }

  // Generate success response based on endpoint
  generateSuccessResponse(endpoint, method, data, requestId) {
    const baseResponse = {
      success: true,
      status: 200,
      requestId,
      timestamp: new Date(),
      data: null,
    };

    // Route-specific responses
    if (endpoint.includes('/api/auth')) {
      baseResponse.data = this.generateAuthResponse(method, data);
    } else if (endpoint.includes('/api/users')) {
      baseResponse.data = this.generateUserResponse(method, data);
    } else if (endpoint.includes('/api/payments')) {
      baseResponse.data = this.generatePaymentResponse(method, data);
    } else if (endpoint.includes('/api/investments')) {
      baseResponse.data = this.generateInvestmentResponse(method, data);
    } else if (endpoint.includes('/api/leaders')) {
      baseResponse.data = this.generateLeaderResponse(method, data);
    } else if (endpoint.includes('/api/contracts')) {
      baseResponse.data = this.generateContractResponse(method, data);
    } else {
      baseResponse.data = { message: 'Request processed successfully' };
    }

    return baseResponse;
  }

  // Generate error response with realistic errors
  generateErrorResponse(endpoint, method, requestId) {
    const errorTypes = [
      { code: 'NETWORK_ERROR', message: 'Network connection timeout', status: 503 },
      { code: 'VALIDATION_ERROR', message: 'Invalid request data', status: 400 },
      { code: 'UNAUTHORIZED', message: 'Unauthorized access', status: 401 },
      { code: 'FORBIDDEN', message: 'Access denied', status: 403 },
      { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
      { code: 'RATE_LIMIT', message: 'Rate limit exceeded', status: 429 },
      { code: 'SERVER_ERROR', message: 'Internal server error', status: 500 },
    ];

    const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];

    return {
      success: false,
      status: error.status,
      requestId,
      timestamp: new Date(),
      error: {
        code: error.code,
        message: error.message,
        details: `Error occurred while calling ${method} ${endpoint}`,
      },
    };
  }

  // Response generators for each endpoint
  generateAuthResponse(method, data) {
    if (method === 'POST') {
      return {
        accessToken: `TOKEN-${Math.random().toString(36).substr(2, 20)}`,
        refreshToken: `REFRESH-${Math.random().toString(36).substr(2, 20)}`,
        expiresIn: 3600,
        user: {
          id: 'USER-001',
          email: data?.email || 'user@example.com',
          role: 'user',
        },
      };
    }
    return { authenticated: true, user: { id: 'USER-001', email: 'user@example.com' } };
  }

  generateUserResponse(method, data) {
    if (method === 'GET') {
      return {
        id: data?.id || 'USER-001',
        email: 'user@example.com',
        fullName: 'John Doe',
        role: 'user',
        status: 'active',
        createdDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      };
    }
    if (method === 'POST') {
      return {
        id: `USER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        email: data?.email,
        fullName: data?.fullName,
        role: 'user',
        status: 'active',
        createdDate: new Date(),
      };
    }
    return { updated: true, id: data?.id };
  }

  generatePaymentResponse(method, data) {
    if (method === 'GET') {
      return {
        id: data?.id || 'PAY-001',
        amount: 1000,
        currency: 'USD',
        status: 'completed',
        method: 'card',
        timestamp: new Date(),
      };
    }
    if (method === 'POST' && data?.action === 'approve') {
      return {
        id: data?.paymentId || 'PAY-001',
        status: 'approved',
        approvedBy: 'admin@example.com',
        approvedAt: new Date(),
        message: 'Payment approved successfully',
      };
    }
    if (method === 'POST' && data?.action === 'process') {
      return {
        id: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: data?.amount,
        status: 'processing',
        reference: `REF-${Date.now()}`,
        timestamp: new Date(),
      };
    }
    return { success: true };
  }

  generateInvestmentResponse(method, data) {
    if (method === 'GET') {
      return {
        id: data?.id || 'INV-001',
        amount: 5000,
        currency: 'USD',
        status: 'active',
        dateCreated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        returns: 250,
      };
    }
    if (method === 'POST') {
      return {
        id: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: data?.amount,
        status: 'pending',
        dateCreated: new Date(),
        message: 'Investment request submitted',
      };
    }
    return { updated: true };
  }

  generateLeaderResponse(method, data) {
    if (method === 'GET') {
      return {
        id: data?.id || 'LEADER-001',
        name: 'Jane Smith',
        email: 'jane@example.com',
        country: 'US',
        status: 'active',
        teamSize: 15,
        volume: 50000,
      };
    }
    if (method === 'POST') {
      return {
        id: `LEADER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        name: data?.name,
        email: data?.email,
        status: 'pending',
        message: 'Leader registration submitted',
      };
    }
    return { updated: true };
  }

  generateContractResponse(method, data) {
    if (method === 'GET') {
      return {
        id: data?.id || 'CONTRACT-001',
        type: 'participation_agreement',
        status: 'signed',
        createdDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        signedDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      };
    }
    if (method === 'POST' && data?.action === 'generate') {
      return {
        id: `CONTRACT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        type: data?.type,
        status: 'draft',
        createdDate: new Date(),
        message: 'Contract generated successfully',
      };
    }
    if (method === 'POST' && data?.action === 'sign') {
      return {
        id: data?.contractId,
        status: 'signed',
        signedDate: new Date(),
        signatureId: `SIG-${Math.random().toString(36).substr(2, 20)}`,
      };
    }
    return { success: true };
  }

  // Simulate delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get request log
  getRequestLog(limit = 50) {
    return this.requestLog.slice(-limit).reverse();
  }

  // Get request statistics
  getStatistics() {
    const total = this.requestLog.length;
    const successful = this.requestLog.filter(r => r.status === 'success').length;
    const failed = this.requestLog.filter(r => r.status === 'error').length;
    const avgDuration = this.requestLog.reduce((sum, r) => sum + (r.duration || 0), 0) / Math.max(1, total);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      avgDuration: Math.round(avgDuration),
    };
  }

  // Subscribe to API events
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify subscribers
  notifySubscribers(event) {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in API subscriber:', error);
      }
    });
  }

  // Clear logs
  clearLogs() {
    this.requestLog = [];
  }

  // Set error rate for testing
  setErrorRate(rate) {
    this.errorRate = Math.max(0, Math.min(1, rate));
  }

  // Set response delay
  setResponseDelay(ms) {
    this.responseDelay = Math.max(0, ms);
  }
}

// Singleton instance
let apiSimulatorInstance = null;

const APISimulator_Singleton = {
  getInstance: () => {
    if (!apiSimulatorInstance) {
      apiSimulatorInstance = new APISimulator();
    }
    return apiSimulatorInstance;
  },
};

export default APISimulator_Singleton;