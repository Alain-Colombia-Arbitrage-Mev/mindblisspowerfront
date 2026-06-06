import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Payout API endpoints
 * Handles payout requests, approvals, and processing
 */
/* global Deno */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  try {
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { error: 'Not authenticated', code: 'NOT_AUTHENTICATED' },
        { status: 401 }
      );
    }

    const tenantId = 'default'; // In production, get from user context
    const userId = user.id;

    // POST /payouts/request
    if (path === '/payouts/request' && method === 'POST') {
      const { amount, method: payoutMethod, destination } = await req.json();

      if (!amount || !payoutMethod || !destination) {
        return Response.json(
          { error: 'Missing required fields', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      // Validate method
      const validMethods = ['bank_transfer', 'stripe_payout', 'crypto_wallet', 'check'];
      if (!validMethods.includes(payoutMethod)) {
        return Response.json(
          { error: 'Invalid payout method', code: 'INVALID_METHOD' },
          { status: 400 }
        );
      }

      // Check user balance from ledger
      const ledger = await base44.entities.Ledger.filter(
        { user_id: userId, tenant_id: tenantId },
        '-created_date',
        10000
      );

      let balance = 0;
      if (ledger) {
        for (const entry of ledger) {
          balance += entry.type === 'credit' ? entry.amount : -entry.amount;
        }
      }

      if (balance < amount) {
        return Response.json(
          {
            error: 'Insufficient balance',
            code: 'INSUFFICIENT_BALANCE',
            balance,
            requested: amount,
          },
          { status: 400 }
        );
      }

      // Create payout request
      const payout = await base44.entities.Payout.create({
        user_id: userId,
        amount,
        currency: 'USD',
        method: payoutMethod,
        destination,
        status: 'requested',
        requested_at: new Date().toISOString(),
        tenant_id: tenantId,
      });

      return Response.json(
        {
          success: true,
          payoutId: payout.id,
          amount,
          method: payoutMethod,
          status: 'requested',
          message: 'Payout request submitted. Awaiting admin approval.',
        },
        { status: 201 }
      );
    }

    // GET /payouts/history
    if (path === '/payouts/history' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const status = url.searchParams.get('status'); // Optional filter

      let filter = { user_id: userId, tenant_id: tenantId };
      if (status) {
        filter.status = status;
      }

      const payouts = await base44.entities.Payout.filter(
        filter,
        '-created_date',
        limit
      );

      return Response.json(
        {
          success: true,
          payouts: payouts || [],
          count: payouts ? payouts.length : 0,
        },
        { status: 200 }
      );
    }

    // GET /payouts/:id
    if (path.startsWith('/payouts/') && method === 'GET' && !path.includes('/history')) {
      const payoutId = path.split('/')[2];

      const payouts = await base44.entities.Payout.filter(
        { id: payoutId, user_id: userId, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!payouts || payouts.length === 0) {
        return Response.json(
          { error: 'Payout not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return Response.json(
        {
          success: true,
          payout: payouts[0],
        },
        { status: 200 }
      );
    }

    // Admin: GET /payouts/pending (admin only)
    if (path === '/payouts/pending' && method === 'GET') {
      const users = await base44.entities.User.filter(
        { id: userId, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!users || users[0].role !== 'admin') {
        return Response.json(
          { error: 'Not authorized', code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }

      const pending = await base44.entities.Payout.filter(
        { status: 'requested', tenant_id: tenantId },
        '-created_date',
        1000
      );

      const total = pending ? pending.reduce((sum, p) => sum + p.amount, 0) : 0;

      return Response.json(
        {
          success: true,
          pendingPayouts: pending || [],
          pendingTotal: total,
          count: pending ? pending.length : 0,
        },
        { status: 200 }
      );
    }

    // Admin: POST /payouts/approve
    if (path === '/payouts/approve' && method === 'POST') {
      const users = await base44.entities.User.filter(
        { id: userId, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!users || users[0].role !== 'admin') {
        return Response.json(
          { error: 'Not authorized', code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }

      const { payoutId } = await req.json();

      if (!payoutId) {
        return Response.json(
          { error: 'Missing payoutId', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      const payouts = await base44.entities.Payout.filter(
        { id: payoutId, status: 'requested', tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!payouts || payouts.length === 0) {
        return Response.json(
          { error: 'Payout not found or not pending', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const payout = payouts[0];

      // Update status
      await base44.entities.Payout.update(payoutId, {
        status: 'approved',
      });

      return Response.json(
        {
          success: true,
          payout: { ...payout, status: 'approved' },
          message: 'Payout approved. Queued for processing.',
        },
        { status: 200 }
      );
    }

    // Admin: POST /payouts/process
    if (path === '/payouts/process' && method === 'POST') {
      const users = await base44.entities.User.filter(
        { id: userId, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!users || users[0].role !== 'admin') {
        return Response.json(
          { error: 'Not authorized', code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }

      const { payoutId } = await req.json();

      if (!payoutId) {
        return Response.json(
          { error: 'Missing payoutId', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      const payouts = await base44.entities.Payout.filter(
        { id: payoutId, status: 'approved', tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!payouts || payouts.length === 0) {
        return Response.json(
          { error: 'Payout not found or not approved', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const payout = payouts[0];

      // Generate transaction ID
      const transactionId = `${payout.method}-${Date.now()}-${payoutId}`;

      // Update status
      await base44.entities.Payout.update(payoutId, {
        status: 'processing',
        transaction_id: transactionId,
      });

      // In production: call provider API (Stripe, bank, crypto, etc.)
      console.log(`Processing payout: ${payoutId} via ${payout.method}`);

      return Response.json(
        {
          success: true,
          payout: { ...payout, status: 'processing', transaction_id: transactionId },
          message: 'Payout processing started.',
        },
        { status: 200 }
      );
    }

    // Admin: POST /payouts/complete
    if (path === '/payouts/complete' && method === 'POST') {
      const users = await base44.entities.User.filter(
        { id: userId, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!users || users[0].role !== 'admin') {
        return Response.json(
          { error: 'Not authorized', code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }

      const { payoutId } = await req.json();

      if (!payoutId) {
        return Response.json(
          { error: 'Missing payoutId', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      const payouts = await base44.entities.Payout.filter(
        { id: payoutId, status: 'processing', tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!payouts || payouts.length === 0) {
        return Response.json(
          { error: 'Payout not found or not processing', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const payout = payouts[0];

      // Update status
      await base44.entities.Payout.update(payoutId, {
        status: 'completed',
        processed_at: new Date().toISOString(),
      });

      // Create ledger entry
      await base44.entities.Ledger.create({
        user_id: payout.user_id,
        type: 'debit',
        category: 'payout',
        amount: payout.amount,
        currency: payout.currency,
        reference_id: payoutId,
        reference_type: 'payout',
        description: `Payout via ${payout.method}`,
        tenant_id: tenantId,
        verified_by: userId,
      });

      return Response.json(
        {
          success: true,
          payout: { ...payout, status: 'completed' },
          message: 'Payout completed.',
        },
        { status: 200 }
      );
    }

    // Admin: POST /payouts/cancel
    if (path === '/payouts/cancel' && method === 'POST') {
      const users = await base44.entities.User.filter(
        { id: userId, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!users || users[0].role !== 'admin') {
        return Response.json(
          { error: 'Not authorized', code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }

      const { payoutId, reason } = await req.json();

      if (!payoutId) {
        return Response.json(
          { error: 'Missing payoutId', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      const payouts = await base44.entities.Payout.filter(
        { id: payoutId, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!payouts || payouts.length === 0) {
        return Response.json(
          { error: 'Payout not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const payout = payouts[0];

      if (['completed', 'processing'].includes(payout.status)) {
        return Response.json(
          { error: 'Cannot cancel payout in progress or completed', code: 'CANNOT_CANCEL' },
          { status: 400 }
        );
      }

      // Update status
      await base44.entities.Payout.update(payoutId, {
        status: 'cancelled',
        notes: reason || 'Cancelled by admin',
      });

      return Response.json(
        {
          success: true,
          payout: { ...payout, status: 'cancelled' },
          message: 'Payout cancelled.',
        },
        { status: 200 }
      );
    }

    return Response.json(
      { error: 'Endpoint not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Payout API error:', error);
    return Response.json(
      { error: error.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
});