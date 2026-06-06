import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Payment API endpoints
 * Handles payment intents, confirmations, and history
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

    // POST /payments/create-intent
    if (path === '/payments/create-intent' && method === 'POST') {
      const { planId } = await req.json();

      if (!planId) {
        return Response.json(
          { error: 'Missing planId', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      // Fetch plan
      const plans = await base44.entities.Plan.filter(
        { id: planId, status: 'active', tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!plans || plans.length === 0) {
        return Response.json(
          { error: 'Plan not found', code: 'PLAN_NOT_FOUND' },
          { status: 404 }
        );
      }

      const plan = plans[0];

      // Create payment record
      const payment = await base44.entities.Payment.create({
        user_id: user.id,
        plan_id: planId,
        amount: plan.amount,
        currency: plan.currency,
        provider: 'stripe',
        status: 'pending',
        reference: `PAY-${Date.now()}-${user.id}`,
        tenant_id: tenantId,
      });

      // Mock Stripe intent
      const mockIntentId = `pi_${Date.now()}_${user.id}`;

      return Response.json(
        {
          success: true,
          paymentId: payment.id,
          intentId: mockIntentId,
          amount: plan.amount,
          currency: plan.currency,
          planName: plan.name,
          status: 'pending',
          // In production: return actual Stripe client_secret
          clientSecret: `${mockIntentId}_secret_mock`,
        },
        { status: 200 }
      );
    }

    // POST /payments/confirm
    if (path === '/payments/confirm' && method === 'POST') {
      const { paymentId, transactionId } = await req.json();

      if (!paymentId || !transactionId) {
        return Response.json(
          { error: 'Missing paymentId or transactionId', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      const payments = await base44.entities.Payment.filter(
        { id: paymentId, user_id: user.id, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!payments || payments.length === 0) {
        return Response.json(
          { error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      const payment = payments[0];

      // Update payment
      await base44.entities.Payment.update(paymentId, {
        status: 'completed',
        transaction_id: transactionId,
        processed_at: new Date().toISOString(),
      });

      // Get plan for commission percentage
      const plans = await base44.entities.Plan.filter(
        { id: payment.plan_id, tenant_id: tenantId },
        '-created_date',
        1
      );

      const plan = plans ? plans[0] : { amount: payment.amount };

      // Create membership
      const membership = await base44.entities.Membership.create({
        user_id: user.id,
        plan_id: payment.plan_id,
        amount: payment.amount,
        currency: payment.currency,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        payment_id: paymentId,
        auto_renew: true,
        tenant_id: tenantId,
      });

      // Create ledger entry
      await base44.entities.Ledger.create({
        user_id: user.id,
        type: 'debit',
        category: 'payment',
        amount: payment.amount,
        currency: payment.currency,
        reference_id: paymentId,
        reference_type: 'payment',
        description: `Membership payment - ${plan.name || 'Plan'}`,
        tenant_id: tenantId,
      });

      // Activate user if pending
      const currentUser = await base44.auth.me();
      if (currentUser && !currentUser.role) {
        // User status update (if needed)
      }

      return Response.json(
        {
          success: true,
          paymentId,
          transactionId,
          membershipId: membership.id,
          status: 'completed',
          message: 'Payment confirmed. Membership activated.',
        },
        { status: 200 }
      );
    }

    // GET /payments/history
    if (path === '/payments/history' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const payments = await base44.entities.Payment.filter(
        { user_id: user.id, tenant_id: tenantId },
        '-created_date',
        limit
      );

      return Response.json(
        {
          success: true,
          payments: payments || [],
          count: payments ? payments.length : 0,
        },
        { status: 200 }
      );
    }

    // GET /payments/:id
    if (path.startsWith('/payments/') && method === 'GET' && !path.includes('/history')) {
      const paymentId = path.split('/')[2];

      const payments = await base44.entities.Payment.filter(
        { id: paymentId, user_id: user.id, tenant_id: tenantId },
        '-created_date',
        1
      );

      if (!payments || payments.length === 0) {
        return Response.json(
          { error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return Response.json(
        {
          success: true,
          payment: payments[0],
        },
        { status: 200 }
      );
    }

    // Stripe webhook (simplified)
    if (path === '/payments/webhook' && method === 'POST') {
      const signature = req.headers.get('stripe-signature');
      
      // In production: verify signature with STRIPE_WEBHOOK_SECRET
      const body = await req.json();

      if (body.type === 'payment_intent.succeeded') {
        const paymentIntentId = body.data.object.id;
        // Find and confirm payment
        console.log(`Stripe webhook: payment succeeded ${paymentIntentId}`);
      }

      return Response.json({ received: true }, { status: 200 });
    }

    return Response.json(
      { error: 'Endpoint not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Payment API error:', error);
    return Response.json(
      { error: error.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
});