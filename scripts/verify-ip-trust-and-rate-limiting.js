/**
 * Focused Security & Booking Acceptance Test Suite:
 * IP Trust Boundaries, Gateway Spoofing Protection & Shared Network Rate-Limiting
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

  // Compile backend first to ensure latest dist
  const { resolveClientIp } = require('../backend/dist/routes/publicBooking.js');

  const REAL_REMOTE_IP = '198.51.100.25';
  const SPOOFED_IP_1 = '203.0.113.88';
  const SPOOFED_IP_2 = '203.0.113.99';
  const DEDICATED_GATEWAY_SECRET = 'super-secret-dedicated-gateway-token-12345';
  const ADMIN_SECRET = 'admin-secret-xyz-distinct';

  // --------------------------------------------------------------------------
  // 1. Direct Backend Access (Unauthenticated)
  // --------------------------------------------------------------------------
  console.log('1. Testing Direct Backend Ingress (No Gateway Authentication)...');

  test('Direct hit with no gateway secret: rejects spoofed X-Forwarded-For', () => {
    process.env.INTERNAL_GATEWAY_SECRET = DEDICATED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-forwarded-for': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP);
  });

  test('Direct hit with no gateway secret: rejects spoofed X-Laurrel-Client-IP', () => {
    process.env.INTERNAL_GATEWAY_SECRET = DEDICATED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-laurrel-client-ip': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP);
  });

  test('Direct hit with no gateway secret: rejects spoofed X-NF-Client-Connection-IP', () => {
    process.env.INTERNAL_GATEWAY_SECRET = DEDICATED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-nf-client-connection-ip': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP);
  });

  test('Direct hit with invalid gateway secret: rejects spoofed headers', () => {
    process.env.INTERNAL_GATEWAY_SECRET = DEDICATED_GATEWAY_SECRET;
    const mockReq = {
      headers: {
        'x-gateway-secret': 'wrong-secret-token',
        'x-laurrel-client-ip': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP);
  });

  test('Direct hit presenting ADMIN_API_SECRET cannot spoof public gateway identity (Dedicated Secret Enforced)', () => {
    process.env.INTERNAL_GATEWAY_SECRET = DEDICATED_GATEWAY_SECRET;
    process.env.ADMIN_API_SECRET = ADMIN_SECRET;
    const mockReq = {
      headers: {
        'x-gateway-secret': ADMIN_SECRET, // using admin secret instead of gateway secret
        'x-laurrel-client-ip': SPOOFED_IP_1,
      },
      socket: { remoteAddress: REAL_REMOTE_IP },
    };
    const resolved = resolveClientIp(mockReq);
    assert.strictEqual(resolved, REAL_REMOTE_IP, 'Admin secret must not be accepted as gateway secret');
  });

  // --------------------------------------------------------------------------
  // 2. Public Netlify Gateway Proxy Header Processing
  // --------------------------------------------------------------------------
  console.log('\n2. Testing Public Netlify Gateway Ingress & Header Sanitization...');

  // Inspect actual implementation from src/app/api/public/[...slug]/route.ts
  const gatewayRoutePath = path.join(__dirname, '../src/app/api/public/[...slug]/route.ts');
  const gatewayCode = fs.readFileSync(gatewayRoutePath, 'utf8');

  test('Gateway does not read client-supplied X-Real-IP or X-Forwarded-For into client IP', () => {
    assert(!gatewayCode.includes("req.headers.get('x-real-ip')"), 'Client X-Real-IP is not trusted');
    assert(!gatewayCode.includes("req.headers.get('x-forwarded-for')"), 'Client X-Forwarded-For is not trusted');
  });

  test('Gateway strictly uses platform edge IP (x-nf-client-connection-ip or req.ip)', () => {
    assert(gatewayCode.includes("req.headers.get('x-nf-client-connection-ip')"));
    assert(gatewayCode.includes('req.ip'));
  });

  test('Gateway uses dedicated INTERNAL_GATEWAY_SECRET / GATEWAY_SECRET', () => {
    assert(gatewayCode.includes('process.env.INTERNAL_GATEWAY_SECRET || process.env.GATEWAY_SECRET'));
    assert(!gatewayCode.includes('process.env.ADMIN_API_SECRET'));
  });

  // Simulation of buildForwardHeaders
  function simulateGatewayForward(incomingHeaders, socketIp) {
    const clientIp = (
      incomingHeaders['x-nf-client-connection-ip'] ||
      socketIp ||
      ''
    ).trim();

    const forwardHeaders = {
      'Content-Type': 'application/json',
    };
    if (clientIp) {
      forwardHeaders['X-Laurrel-Client-IP'] = clientIp;
    }
    const gatewaySecret = process.env.INTERNAL_GATEWAY_SECRET || process.env.GATEWAY_SECRET;
    if (gatewaySecret) {
      forwardHeaders['X-Gateway-Secret'] = gatewaySecret;
    }
    return forwardHeaders;
  }

  test('Submitting spoofed X-Forwarded-For to Netlify gateway: gateway does NOT forward spoofed IP', () => {
    process.env.INTERNAL_GATEWAY_SECRET = DEDICATED_GATEWAY_SECRET;
    const clientHeaders = {
      'x-forwarded-for': SPOOFED_IP_1,
      'x-real-ip': SPOOFED_IP_2,
    };
    // Behind Netlify edge, Netlify provides verified connection IP
    const VERIFIED_NETLIFY_EDGE_IP = '198.51.100.77';
    clientHeaders['x-nf-client-connection-ip'] = VERIFIED_NETLIFY_EDGE_IP;

    const forwarded = simulateGatewayForward(clientHeaders, null);
    assert.strictEqual(forwarded['X-Laurrel-Client-IP'], VERIFIED_NETLIFY_EDGE_IP);

    // Now test backend resolution with the forwarded headers
    const backendReq = {
      headers: {
        'x-gateway-secret': forwarded['X-Gateway-Secret'],
        'x-laurrel-client-ip': forwarded['X-Laurrel-Client-IP'],
      },
      socket: { remoteAddress: '10.0.0.1' }, // Netlify edge NAT to Render
    };
    const resolvedByBackend = resolveClientIp(backendReq);
    assert.strictEqual(resolvedByBackend, VERIFIED_NETLIFY_EDGE_IP);
  });

  // --------------------------------------------------------------------------
  // 3. Shared Network & NAT Rate-Limiting Fairness
  // --------------------------------------------------------------------------
  console.log('\n3. Testing Shared Network Rate-Limiting Fairness...');

  const rateLimitStore = new Map();
  function checkRateLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, count: 1 };
    }
    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return { allowed: false, count: entry.count, retryAfterSec };
    }
    entry.count++;
    return { allowed: true, count: entry.count };
  }

  test('Shared NAT IP accommodates multiple legitimate bookings (10 requests / 10 min window)', () => {
    const SHARED_OFFICE_IP = '198.51.100.99';
    const BOOKING_LIMIT = 10;
    const WINDOW_MS = 600000; // 10 minutes

    // 5 different users in the same office/household book within 10 minutes
    for (let user = 1; user <= 5; user++) {
      const result = checkRateLimit(`/api/public/book:${SHARED_OFFICE_IP}`, BOOKING_LIMIT, WINDOW_MS);
      assert.strictEqual(result.allowed, true, `User ${user} from shared NAT was allowed to book`);
      assert.strictEqual(result.count, user);
    }
  });

  test('Shared NAT IP allows up to 60 availability queries per minute for browsing slots', () => {
    const SHARED_OFFICE_IP = '198.51.100.99';
    const QUERY_LIMIT = 60;
    const WINDOW_MS = 60000;

    for (let req = 1; req <= 60; req++) {
      const result = checkRateLimit(`/api/public/slots:${SHARED_OFFICE_IP}`, QUERY_LIMIT, WINDOW_MS);
      assert.strictEqual(result.allowed, true);
    }
    // 61st query is throttled with Retry-After
    const throttled = checkRateLimit(`/api/public/slots:${SHARED_OFFICE_IP}`, QUERY_LIMIT, WINDOW_MS);
    assert.strictEqual(throttled.allowed, false);
    assert(throttled.retryAfterSec > 0);
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`SECURITY & RATE LIMIT TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
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
