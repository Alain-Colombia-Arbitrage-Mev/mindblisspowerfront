import assert from "node:assert/strict";
import test from "node:test";

import { adminUrl, customerDomainDecision, normalizeHost, normalizedApplicationPath } from "./domain-routing.js";

test("normalizes host names with ports", () => {
  assert.equal(normalizeHost("APP.MINDBLISSPOWER.COM:443"), "app.mindblisspower.com");
});

test("keeps member routes on the customer app", () => {
  assert.deepEqual(
    customerDomainDecision({ host: "app.mindblisspower.com", pathname: "/dashboard/network" }),
    { type: "pass" },
  );
});

test("hides admin APIs on the customer app", () => {
  assert.deepEqual(
    customerDomainDecision({ host: "app.mindblisspower.com", pathname: "/api/admin/summary" }),
    { type: "notFound" },
  );
  assert.deepEqual(
    customerDomainDecision({ host: "98.83.116.99.sslip.io", pathname: "/api/admin/summary" }),
    { type: "notFound" },
  );
});

test("redirects admin pages to the admin app", () => {
  assert.deepEqual(
    customerDomainDecision({ host: "app.mindblisspower.com", pathname: "/dashboard/admin" }),
    { type: "redirect", location: adminUrl("/dashboard") },
  );
  assert.deepEqual(
    customerDomainDecision({ host: "app.mindblisspower.com", pathname: "/dashboard/command-center" }),
    { type: "redirect", location: adminUrl("/dashboard/centro-de-mando") },
  );
});

test("does not affect local development hosts", () => {
  assert.deepEqual(
    customerDomainDecision({ host: "localhost:3000", pathname: "/api/admin/summary" }),
    { type: "pass" },
  );
});

test('canonical public and legacy hosts isolate encoded admin routes without disturbing auth, referrals or webhooks', () => {
  for (const host of ['mindblisspower.com', 'MINDBLISSPOWER.COM:443', 'app.mindblisspower.com', 'test.sslip.io']) {
    for (const pathname of ['/api/admin', '/api/admin/summary', '/%61pi/admin/users', '/api/%2561dmin/users',
      '/api%2fadmin/withdrawals/action', '//api//admin/users', '/api/member/%2e%2e/admin/users', '/API/ADMIN/users']) {
      assert.deepEqual(customerDomainDecision({ host, pathname }), { type: 'notFound' }, `${host}${pathname}`);
    }
    for (const pathname of ['/login', '/register', '/dashboard/network', '/api/auth/sign-in/email-otp',
      '/api/webhooks/resend', '/api/webhooks/nowpayments', '/api/administrator']) {
      assert.deepEqual(customerDomainDecision({ host, pathname }), { type: 'pass' });
    }
    assert.deepEqual(customerDomainDecision({ host, pathname: '/dashboard/%61dmin' }), { type: 'redirect', location: adminUrl('/dashboard') });
  }
  for (const host of ['localhost:3000', '127.0.0.1:3000', 'admin.mindblisspower.com:443']) {
    assert.deepEqual(customerDomainDecision({ host, pathname: '/api/admin/summary' }), { type: 'pass' });
  }
});

test('admission normalization is bounded and rejects malformed paths without rewriting public destinations', () => {
  for (const path of ['/api/%', '/api/%00admin', '/api/%5cadmin', '/api/%3fadmin', '/api/%23admin',
    '/api/' + '%25'.repeat(8192), 'https://attacker.test/api/admin']) assert.equal(normalizedApplicationPath(path), null);
  assert.equal(normalizedApplicationPath('/api/%61dmin/../admin/summary'), '/api/admin/summary');
  assert.equal(normalizedApplicationPath('//api///admin/summary'), '/api/admin/summary');
});
