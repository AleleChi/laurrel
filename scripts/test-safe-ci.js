/**
 * LAURREL SERVICES — CI RELEASE VERIFICATION SUITE
 * 
 * Safe automated tests that do NOT require production credentials or a database connection.
 * Can execute in GitHub Actions CI, staging runners, and local developer environments.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runCiTests() {
  console.log('====================================================');
  console.log('LAURREL SERVICES — CI RELEASE VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 1: Repository Privacy & Git Guards
  // ----------------------------------------------------
  console.log('--- SUITE 1: Repository Privacy & Git Guardrails ---');

  // Check 1.1: .gitignore has screenshots pattern
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  assert(
    gitignoreContent.includes('docs/screenshots/'),
    'Privacy Guard: .gitignore excludes docs/screenshots/'
  );

  // Check 1.2: No sensitive admin audit or sprint 1 screenshots tracked in git index
  let trackedAdminScreenshots = '';
  try {
    trackedAdminScreenshots = execSync('git ls-files "docs/screenshots/admin-audit/*" "docs/screenshots/admin-sprint-1/*"', {
      encoding: 'utf8',
    }).trim();
  } catch (e) {
    trackedAdminScreenshots = '';
  }
  assert(
    trackedAdminScreenshots.length === 0,
    'Privacy Guard: Zero sensitive admin screenshots tracked in git index',
    trackedAdminScreenshots ? `Found tracked: ${trackedAdminScreenshots}` : ''
  );

  // Check 1.3: No secret .env files tracked in git index (ignoring .env.example)
  let trackedEnvFiles = '';
  try {
    const allTracked = execSync('git ls-files "*.env*" "**/.env*"', { encoding: 'utf8' }).trim().split('\n');
    const secretEnvFiles = allTracked.filter((f) => f && !f.endsWith('.example'));
    trackedEnvFiles = secretEnvFiles.join(', ');
  } catch (e) {
    trackedEnvFiles = '';
  }
  assert(
    trackedEnvFiles.length === 0,
    'Security Guard: Zero secret .env files tracked in git index',
    trackedEnvFiles ? `Found tracked: ${trackedEnvFiles}` : ''
  );

  // ----------------------------------------------------
  // TEST SUITE 2: Behavioural Runner Safety Guardrail
  // ----------------------------------------------------
  console.log('\n--- SUITE 2: Behavioural Runner Safety Guard ---');

  // Check 2.1: test-sprint1-behavioural.js must reject execution without test DB
  let runnerExitedSafely = false;
  let runnerOutput = '';
  try {
    // Run with clean environment (no DATABASE_URL, no TEST_DATABASE_URL)
    runnerOutput = execSync('node scripts/test-sprint1-behavioural.js', {
      env: { ...process.env, TEST_DATABASE_URL: '', STAGING_DATABASE_URL: '', DATABASE_URL: '' },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (procErr) {
    // Process is EXPECTED to exit with code 1
    runnerExitedSafely = procErr.status === 1;
    runnerOutput = (procErr.stdout || '') + (procErr.stderr || '');
  }

  assert(
    runnerExitedSafely && runnerOutput.includes('ENVIRONMENT SAFETY GUARD REJECTION'),
    'Safety Guard: test-sprint1-behavioural.js refuses execution without isolated test DB'
  );

  // ----------------------------------------------------
  // TEST SUITE 3: State Machine Logic Unit Verification
  // ----------------------------------------------------
  console.log('\n--- SUITE 3: Callback State Machine Unit Verification ---');

  // Load compiled repo module
  const repoModule = require(path.resolve('backend/dist/database/enquiryRepo.js'));
  const { validateHandoffTransition, PERMITTED_HANDOFF_TRANSITIONS, HandoffTransitionError } = repoModule;

  assert(Boolean(validateHandoffTransition), 'State Machine: validateHandoffTransition is exported');
  assert(Boolean(PERMITTED_HANDOFF_TRANSITIONS), 'State Machine: PERMITTED_HANDOFF_TRANSITIONS contract is defined');

  // Test valid transitions
  const validTransitions = [
    ['pending', 'contacted'],
    ['pending', 'resolved'],
    ['pending', 'dismissed'],
    ['contacted', 'resolved'],
    ['contacted', 'dismissed'],
    ['contacted', 'pending'],
    ['resolved', 'pending'],
    ['dismissed', 'pending'],
  ];

  for (const [from, to] of validTransitions) {
    try {
      validateHandoffTransition(from, to);
      assert(true, `State Transition [${from} -> ${to}]: Permitted`);
    } catch (err) {
      assert(false, `State Transition [${from} -> ${to}]: Erroneously rejected: ${err.message}`);
    }
  }

  // Test invalid transitions (must throw HandoffTransitionError)
  const invalidTransitions = [
    ['resolved', 'contacted'],
    ['resolved', 'dismissed'],
    ['resolved', 'resolved'],
    ['dismissed', 'contacted'],
    ['dismissed', 'resolved'],
    ['dismissed', 'dismissed'],
    ['pending', 'pending'],
    ['contacted', 'contacted'],
  ];

  for (const [from, to] of invalidTransitions) {
    try {
      validateHandoffTransition(from, to);
      assert(false, `Invalid Transition [${from} -> ${to}]: Erroneously accepted!`);
    } catch (err) {
      const isExpectedError = err instanceof HandoffTransitionError || err.name === 'HandoffTransitionError';
      assert(isExpectedError, `Invalid Transition [${from} -> ${to}]: Rejected with HandoffTransitionError`);
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 4: Routing & Sub-route Shadowing Protection
  // ----------------------------------------------------
  console.log('\n--- SUITE 4: Sub-Route Shadowing Protection ---');
  const appointmentsSource = fs.readFileSync('backend/src/routes/appointments.ts', 'utf8');
  assert(
    appointmentsSource.includes("if (id === 'settings' || id === 'staff' || id === 'enquiry')"),
    'Routing Integrity: appointmentsRouter guards against shadowing /settings subroute'
  );

  const indexSource = fs.readFileSync('backend/src/index.ts', 'utf8');
  assert(
    indexSource.includes('app.use(appointmentSettingsRouter)'),
    'Routing Integrity: appointmentSettingsRouter explicitly mounted in backend application'
  );

  // ----------------------------------------------------
  // TEST SUITE 5: Pagination Implementation Verification
  // ----------------------------------------------------
  console.log('\n--- SUITE 5: Frontend Pagination Verification ---');
  const enquiriesPageSource = fs.readFileSync('src/app/admin/enquiries/page.tsx', 'utf8');
  assert(
    enquiriesPageSource.includes('loadHandoffsPage') &&
    enquiriesPageSource.includes('handoffPage') &&
    enquiriesPageSource.includes('handoffTotalPages'),
    'Pagination Integrity: enquiries page implements loadHandoffsPage, handoffPage, and handoffTotalPages'
  );
  assert(
    enquiriesPageSource.includes('aria-label="Go to previous page"') &&
    enquiriesPageSource.includes('aria-label="Go to next page"'),
    'Accessibility Integrity: Pagination controls have accessible aria-labels'
  );

  console.log('\n====================================================');
  console.log(`CI TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCiTests().catch((err) => {
  console.error('Unhandled CI test suite failure:', err);
  process.exit(1);
});
