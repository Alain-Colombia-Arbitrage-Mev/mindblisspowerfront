import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Authentication API endpoints
 */
/* global Deno */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Rate limiting check (simplified - use Redis in production)
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // POST /auth/login
    if (path === '/auth/login' && method === 'POST') {
      const { email, password, tenantId = 'default' } = await req.json();

      if (!email || !password) {
        return Response.json(
          { error: 'Missing email or password', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      // Import auth service (simplified - in production use module imports)
      const users = await base44.entities.User.filter({ email, tenant_id: tenantId }, '-created_date', 1);
      
      if (!users || users.length === 0) {
        return Response.json(
          { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
          { status: 401 }
        );
      }

      const user = users[0];

      // Verify password (mock - in production use bcrypt)
      const passwordMatch = password === user.password_hash; // MOCK - use bcrypt in production
      if (!passwordMatch) {
        return Response.json(
          { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
          { status: 401 }
        );
      }

      // Check account status
      if (user.status === 'suspended') {
        return Response.json(
          { error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' },
          { status: 403 }
        );
      }

      // Generate tokens (mock JWT)
      const accessToken = btoa(JSON.stringify({ userId: user.id, type: 'access', exp: Date.now() + 3600000 }));
      const refreshToken = btoa(JSON.stringify({ userId: user.id, type: 'refresh', exp: Date.now() + 604800000 }));

      // Create session
      const session = await base44.entities.Session.create({
        user_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent') || 'unknown',
        expires_at: new Date(Date.now() + 604800000).toISOString(),
        is_active: true,
        tenant_id: tenantId,
      });

      // Update last login
      await base44.entities.User.update(user.id, {
        last_login: new Date().toISOString(),
        status: user.status === 'pending_verification' ? 'active' : user.status,
      });

      return Response.json(
        {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            rank: user.rank,
            role: user.role,
          },
          accessToken,
          refreshToken,
          sessionId: session.id,
        },
        { status: 200 }
      );
    }

    // POST /auth/register
    if (path === '/auth/register' && method === 'POST') {
      const { name, email, password, phone, country, tenantId = 'default' } = await req.json();

      if (!name || !email || !password || !country) {
        return Response.json(
          { error: 'Missing required fields', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      // Check email not taken
      const existing = await base44.entities.User.filter({ email, tenant_id: tenantId }, '-created_date', 1);
      if (existing && existing.length > 0) {
        return Response.json(
          { error: 'Email already registered', code: 'EMAIL_EXISTS' },
          { status: 409 }
        );
      }

      // Create user
      const user = await base44.entities.User.create({
        name,
        email,
        password_hash: password, // MOCK - use bcrypt in production
        phone,
        country,
        status: 'pending_verification',
        role: 'member',
        tenant_id: tenantId,
        kyc_status: 'pending',
        kyb_status: 'pending',
      });

      return Response.json(
        {
          success: true,
          userId: user.id,
          message: 'Registration successful. Please verify your email.',
        },
        { status: 201 }
      );
    }

    // POST /auth/logout
    if (path === '/auth/logout' && method === 'POST') {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json(
          { error: 'Not authenticated', code: 'NOT_AUTHENTICATED' },
          { status: 401 }
        );
      }

      const { sessionId } = await req.json();
      if (sessionId) {
        await base44.entities.Session.update(sessionId, { is_active: false });
      }

      return Response.json({ success: true, message: 'Logged out' }, { status: 200 });
    }

    // POST /auth/reset-request
    if (path === '/auth/reset-request' && method === 'POST') {
      const { email, tenantId = 'default' } = await req.json();

      if (!email) {
        return Response.json(
          { error: 'Missing email', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      const users = await base44.entities.User.filter({ email, tenant_id: tenantId }, '-created_date', 1);
      
      // Return generic message to prevent email enumeration
      if (!users || users.length === 0) {
        return Response.json(
          { success: true, message: 'If email exists, reset link sent' },
          { status: 200 }
        );
      }

      const user = users[0];
      const resetToken = Math.random().toString(36).substring(2, 15);
      const resetExpires = new Date(Date.now() + 3600000).toISOString();

      await base44.entities.User.update(user.id, {
        password_reset_token: resetToken, // MOCK - use hashed token in production
        password_reset_expires: resetExpires,
      });

      // In production: send email with reset link
      console.log(`Password reset requested for ${email}. Token: ${resetToken}`);

      return Response.json(
        { success: true, message: 'If email exists, reset link sent' },
        { status: 200 }
      );
    }

    // POST /auth/reset-confirm
    if (path === '/auth/reset-confirm' && method === 'POST') {
      const { email, resetToken, newPassword, tenantId = 'default' } = await req.json();

      if (!email || !resetToken || !newPassword) {
        return Response.json(
          { error: 'Missing required fields', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }

      const users = await base44.entities.User.filter({ email, tenant_id: tenantId }, '-created_date', 1);
      
      if (!users || users.length === 0) {
        return Response.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      const user = users[0];

      // Validate token
      if (!user.password_reset_token || user.password_reset_token !== resetToken) {
        return Response.json(
          { error: 'Invalid reset token', code: 'INVALID_TOKEN' },
          { status: 400 }
        );
      }

      if (new Date() > new Date(user.password_reset_expires)) {
        return Response.json(
          { error: 'Reset token expired', code: 'TOKEN_EXPIRED' },
          { status: 400 }
        );
      }

      // Update password
      await base44.entities.User.update(user.id, {
        password_hash: newPassword, // MOCK - use bcrypt in production
        password_reset_token: null,
        password_reset_expires: null,
      });

      return Response.json(
        { success: true, message: 'Password updated successfully' },
        { status: 200 }
      );
    }

    // GET /auth/me
    if (path === '/auth/me' && method === 'GET') {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json(
          { error: 'Not authenticated', code: 'NOT_AUTHENTICATED' },
          { status: 401 }
        );
      }

      return Response.json(
        {
          success: true,
          user: {
            id: user.id,
            name: user.full_name,
            email: user.email,
          },
        },
        { status: 200 }
      );
    }

    return Response.json(
      { error: 'Endpoint not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Auth API error:', error);
    return Response.json(
      { error: error.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
});