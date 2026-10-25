/**
 * Focused Security & Booking Acceptance Test Suite:
 * IP Trust Boundaries & Rate-Limiting Protection
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runSecurityTests() {
  console.log('================================================================');
  console.log('LAURREL SERVICES — CLIENT-IP TRUST BOUNDARY & RATE LIMIT TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  const { resolveClientIp } = require('../backend/dist/routes/publicBooking.js');

  const REAL_REMOTE_IP = '198.51.100.25';
  const SPOOFED_IP_1 = '203.0.113.88';
  const SPOOFED_IP_2 = '203.0.113.99';
  const VERIFIED_GATEWAY_SECRET = 'super-secret-gateway-token-12345';

  // 1. Unauthenticated direct hit with spoofed headers must be ignored
  test('Direct hit with no gateway secret: rejects spoofed X-Forwarded-For', () => {
    process.env.INTERNAL_GATEWAY_SECRET = VERIFIED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-forwarded-for': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP, `Expected ${REAL_REMOTE_IP}, got ${resolved}`);
  });

  test('Direct hit with no gateway secret: rejects spoofed X-Laurrel-Client-IP', () => {
    process.env.INTERNAL_GATEWAY_SECRET = VERIFIED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-laurrel-client-ip': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP, `Expected ${REAL_REMOTE_IP}, got ${resolved}`);
  });

  test('Direct hit with no gateway secret: rejects spoofed X-NF-Client-Connection-IP', () => {
    process.env.INTERNAL_GATEWAY_SECRET = VERIFIED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-nf-client-connection-ip': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP, `Expected ${REAL_REMOTE_IP}, got ${resolved}`);
  });

  test('Direct hit with invalid gateway secret: rejects spoofed headers', () => {
    process.env.INTERNAL_GATEWAY_SECRET = VERIFIED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-gateway-secret': 'wrong-secret-token',
        'x-laurrel-client-ip': SPOOFED_IP_1,
        'x-forwarded-for': SPOOFED_IP_2,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP, `Expected ${REAL_REMOTE_IP}, got ${resolved}`);
  });

  // 2. Authenticated gateway requests must trust forwarded headers
  test('Authenticated Next.js gateway: trusts X-Laurrel-Client-IP with X-Gateway-Secret', () => {
    process.env.INTERNAL_GATEWAY_SECRET = VERIFIED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-gateway-secret': VERIFIED_GATEWAY_SECRET,
        'x-laurrel-client-ip': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, SPOOFED_IP_1, `Expected ${SPOOFED_IP_1}, got ${resolved}`);
  });

  test('Authenticated Next.js gateway: trusts X-Gateway-Secret matching ADMIN_API_SECRET', () => {
    delete process.env.INTERNAL_GATEWAY_SECRET;
    delete process.env.GATEWAY_SECRET;
    process.env.ADMIN_API_SECRET = 'admin-secret-xyz';
    const mockReq = {
      headers: {
        'x-gateway-secret': 'admin-secret-xyz',
        'x-laurrel-client-ip': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, SPOOFED_IP_1, `Expected ${SPOOFED_IP_1}, got ${resolved}`);
  });

  test('Authenticated Next.js gateway: trusts X-Admin-Token matching GATEWAY_SECRET', () => {
    delete process.env.INTERNAL_GATEWAY_SECRET;
    delete process.env.ADMIN_API_SECRET;
    process.env.GATEWAY_SECRET = 'gateway-token-789';
    const mockReq = {
      headers: {
        'x-admin-token': 'gateway-token-789',
        'x-forwarded-for': `${SPOOFED_IP_2}, 10.0.0.1`,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, SPOOFED_IP_2, `Expected ${SPOOFED_IP_2}, got ${resolved}`);
  });

  test('Fallback when socket remoteAddress is missing returns 127.0.0.1', () => {
    process.env.INTERNAL_GATEWAY_SECRET = VERIFIED_GATEWAY_SECRET;
    const mockReq = {
      headers: {},
      socket: {},
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, '127.0.0.1');
  });

  // 3. Static verification of frontend gateway route proxy
  test('Next.js route proxy forwards gateway secret & client IP safely', () => {
    const routePath = path.join(__dirname, '../src/app/api/public/[...slug]/route.ts');
    const routeCode = fs.readFileSync(routePath, 'utf8');

    assert(
      routeCode.includes('ADMIN_API_SECRET') && routeCode.includes('INTERNAL_GATEWAY_SECRET'),
      'Route proxy includes fallback resolution for ADMIN_API_SECRET & INTERNAL_GATEWAY_SECRET'
    );
    assert(
      routeCode.includes("forwardHeaders['X-Gateway-Secret'] = gatewaySecret"),
      'Route proxy attaches X-Gateway-Secret to upstream request'
    );
    assert(
      routeCode.includes("forwardHeaders['X-Laurrel-Client-IP'] = clientIp"),
      'Route proxy forwards client IP in X-Laurrel-Client-IP'
    );
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`SECURITY TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
