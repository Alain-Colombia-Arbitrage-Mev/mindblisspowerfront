import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Commission API endpoints
 * Handles commission calculations, history, and ledger
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

    // GET /commissions/summary
    if (path === '/commissions/summary' && method === 'GET') {
      // Get active membership
      const memberships = await base44.entities.Membership.filter(
        { user_id: userId, status: 'active', tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!memberships || memberships.length === 0) {
        return Response.json(
          {
            success: true,
            summary: {
              monthlyBase: 0,
              binaryBonus: 0,
              networkBonus: 0,
              directBonus: 0,
              totalMonthly: 0,
              totalEarned: 0,
            },
            message: 'No active membership',
          },
          { status: 200 }
        );
      }

      const membership = memberships[0];
      const monthlyBase = (membership.amount / 12) * 0.01; // 1% of monthly

      // Get network structure
      const nodes = await base44.entities.NetworkNode.filter(
        { tenant_id: tenantId },
        '-created_date',
        10000
      );

      // Calculate binary bonus (mock)
      let binaryBonus = 0;
      const userNode = nodes ? nodes.find(n => n.user_id === userId) : null;
      if (userNode && nodes) {
        const leftSide = nodes.filter(n => n.upline_id === userId && n.binary_side === 'left');
        const rightSide = nodes.filter(n => n.upline_id === userId && n.binary_side === 'right');
        binaryBonus = (leftSide.length + rightSide.length) * 50; // Mock calculation
      }

      // Get commissions this month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const commissions = await base44.entities.Commission.filter(
        { user_id: userId, period: currentMonth, status: 'approved', tenant_id: tenantId },
        '-created_date',
        1000
      );

      const totalEarned = commissions ? commissions.reduce((sum, c) => sum + c.amount, 0) : 0;

      return Response.json(
        {
          success: true,
          summary: {
            monthlyBase,
            binaryBonus,
            networkBonus: 0, // Mock
            directBonus: 0, // Mock
            totalMonthly: monthlyBase + binaryBonus,
            totalEarned,
            activeMembership: true,
          },
        },
        { status: 200 }
      );
    }

    // GET /commissions/history
    if (path === '/commissions/history' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const period = url.searchParams.get('period'); // Optional filter

      let filter = { user_id: userId, tenant_id: tenantId };
      if (period) {
        filter.period = period;
      }

      const commissions = await base44.entities.Commission.filter(
        filter,
        '-created_date',
        limit
      );

      return Response.json(
        {
          success: true,
          commissions: commissions || [],
          count: commissions ? commissions.length : 0,
        },
        { status: 200 }
      );
    }

    // GET /commissions/ledger
    if (path === '/commissions/ledger' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '100');

      const ledger = await base44.entities.Ledger.filter(
        { user_id: userId, tenant_id: tenantId },
        '-created_date',
        limit
      );

      // Calculate balance
      let balance = 0;
      if (ledger) {
        for (const entry of ledger) {
          balance += entry.type === 'credit' ? entry.amount : -entry.amount;
        }
      }

      return Response.json(
        {
          success: true,
          ledger: ledger || [],
          balance,
          count: ledger ? ledger.length : 0,
        },
        { status: 200 }
      );
    }

    // GET /commissions/pending
    if (path === '/commissions/pending' && method === 'GET') {
      const pending = await base44.entities.Commission.filter(
        { user_id: userId, status: 'pending', tenant_id: tenantId },
        '-created_date',
        1000
      );

      const total = pending ? pending.reduce((sum, c) => sum + c.amount, 0) : 0;

      return Response.json(
        {
          success: true,
          pendingCommissions: pending || [],
          pendingTotal: total,
          count: pending ? pending.length : 0,
        },
        { status: 200 }
      );
    }

    // Admin: POST /commissions/calculate (admin only)
    if (path === '/commissions/calculate' && method === 'POST') {
      // Check if user is admin
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

      const { targetUserId, period } = await req.json();

      if (!targetUserId || !period) {
        return Response.json(
          { error: 'Missing targetUserId or period', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      // Get target user membership
      const memberships = await base44.entities.Membership.filter(
        { user_id: targetUserId, status: 'active', tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!memberships || memberships.length === 0) {
        return Response.json(
          { error: 'No active membership for user', code: 'NO_MEMBERSHIP' },
          { status: 404 }
        );
      }

      const membership = memberships[0];
      const monthlyBase = (membership.amount / 12) * 0.01;

      // Create commission entry
      const commission = await base44.entities.Commission.create({
        user_id: targetUserId,
        type: 'base',
        amount: monthlyBase,
        currency: 'USD',
        period,
        status: 'pending',
        source_user_id: userId,
        tenant_id: tenantId,
        calculation_details: JSON.stringify({
          formula: 'investment / 12 * 0.01',
          investment: membership.amount,
        }),
      });

      return Response.json(
        {
          success: true,
          commission,
          message: 'Commission calculated for period',
        },
        { status: 201 }
      );
    }

    // Admin: POST /commissions/approve
    if (path === '/commissions/approve' && method === 'POST') {
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

      const { commissionId } = await req.json();

      if (!commissionId) {
        return Response.json(
          { error: 'Missing commissionId', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      const commissions = await base44.entities.Commission.filter(
        { id: commissionId, status: 'pending', tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!commissions || commissions.length === 0) {
        return Response.json(
          { error: 'Commission not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const commission = commissions[0];

      // Update status
      await base44.entities.Commission.update(commissionId, {
        status: 'approved',
      });

      // Create ledger entry
      const ledger = await base44.entities.Ledger.create({
        user_id: commission.user_id,
        type: 'credit',
        category: 'commission',
        amount: commission.amount,
        currency: 'USD',
        reference_id: commissionId,
        reference_type: 'commission',
        description: `${commission.type} commission approved (${commission.period})`,
        tenant_id: tenantId,
        verified_by: userId,
      });

      return Response.json(
        {
          success: true,
          commission: { ...commission, status: 'approved' },
          ledgerEntry: ledger,
          message: 'Commission approved and posted to ledger',
        },
        { status: 200 }
      );
    }

    return Response.json(
      { error: 'Endpoint not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Commission API error:', error);
    return Response.json(
      { error: error.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
});