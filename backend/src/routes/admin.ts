import { Router, Request, Response } from 'express';
import { requireAdminAuth, requireRole } from '../middleware/auth';
import {
  listEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  listAiHandoffs,
} from '../database/enquiryRepo';
import {
  findAdminByEmail,
  verifyAndUpgradePassword,
  handleLoginSuccess,
  handleLoginFailure,
  createAdminSession,
  revokeAdminSession,
  createPasswordResetToken,
  resetAdminPasswordWithToken,
  recordAuthEvent,
} from '../database/adminRepo';
import { getEmailProvider } from '../services/email';
import { getDbPool } from '../database/pool';

export const adminRouter = Router();

// ==========================================
// UNPROTECTED AUTHENTICATION ENDPOINTS
// (Must be mounted before requireAdminAuth)
// ==========================================

/**
 * POST /api/admin/auth/login - Authenticate administrator credentials against PostgreSQL
 */
adminRouter.post('/api/admin/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'unknown';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const admin = await findAdminByEmail(trimmedEmail);

    if (!admin) {
      // Record failure for rate tracking without enumerating accounts
      await handleLoginFailure(trimmedEmail, ip, ua);
      res.status(401).json({ error: 'Invalid administrator email or password.' });
      return;
    }

    // Check account lockout
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      const waitMinutes = Math.ceil((new Date(admin.lockedUntil).getTime() - Date.now()) / 60000);
      res.status(423).json({
        error: `Account is temporarily locked due to multiple failed login attempts. Please retry in ${waitMinutes} minute(s).`,
      });
      return;
    }

    // Verify password (Argon2id + scrypt upgrade)
    const valid = await verifyAndUpgradePassword(admin.id, String(password), admin.passwordHash);

    if (!valid) {
      const { locked } = await handleLoginFailure(trimmedEmail, ip, ua);
      if (locked) {
        res.status(423).json({
          error: 'Account has been temporarily locked for 15 minutes due to multiple failed login attempts.',
        });
        return;
      }
      res.status(401).json({ error: 'Invalid administrator email or password.' });
      return;
    }

    // Successful login: reset counters and create database session
    await handleLoginSuccess(admin.id, admin.email, ip, ua);
    const session = await createAdminSession(admin.id, ip, ua);

    res.status(200).json({
      success: true,
      sessionId: session?.id,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (err: any) {
    console.error('[Admin Login Error]:', err);
    res.status(500).json({ error: 'An unexpected internal error occurred during authentication.' });
  }
});

/**
 * POST /api/admin/auth/recover - Request password recovery instructions
 */
adminRouter.post('/api/admin/auth/recover', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'unknown';

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Check if transactional email provider is configured
    const emailProvider = getEmailProvider();
    if (!emailProvider.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Password recovery email service is not currently configured. Please contact dispatch leadership or the system administrator directly.',
        code: 'EMAIL_SERVICE_UNCONFIGURED',
      });
      return;
    }

    // Generate reset token safely (never logged, hashed before storage in Neon)
    const tokenResult = await createPasswordResetToken(trimmedEmail);

    if (tokenResult) {
      // Use verified configured frontend origin; NEVER trust client request Host headers
      const configuredOrigin = (
        process.env.FRONTEND_ORIGIN ||
        (process.env.NODE_ENV === 'production' ? 'https://laurrel.netlify.app' : 'http://localhost:3000')
      ).replace(/\/$/, '');

      const resetLink = `${configuredOrigin}/admin/reset-password?token=${tokenResult.rawToken}`;

      // Dispatch reset email via verified email service
      const dispatch = await emailProvider.sendPasswordResetEmail(
        tokenResult.user.email,
        resetLink,
        tokenResult.user.name
      );

      if (dispatch.success) {
        await recordAuthEvent(trimmedEmail, 'password_reset_dispatched', ip, ua);
      } else {
        await recordAuthEvent(trimmedEmail, 'password_reset_dispatch_failed', ip, ua);
        console.error('[Admin Recovery] Failed to deliver recovery email:', dispatch.error);
      }
    } else {
      // Record unknown attempt without leaking account non-existence
      await recordAuthEvent(trimmedEmail, 'password_reset_unknown_email', ip, ua);
    }

    // Neutral response to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an authorized administrator account exists for this email address, password recovery instructions have been sent. The link will expire in 30 minutes.',
    });
  } catch (err: any) {
    console.error('[Admin Recovery Error]:', err);
    res.status(500).json({ error: 'Could not process password recovery request.' });
  }
});

/**
 * POST /api/admin/auth/reset-password - Complete password reset using single-use token
 */
adminRouter.post('/api/admin/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'unknown';

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'Password reset token is required.' });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ success: false, error: 'New password is required.' });
      return;
    }

    if (newPassword.length < 10) {
      res.status(400).json({ success: false, error: 'Password must be at least 10 characters in length.' });
      return;
    }

    const resetResult = await resetAdminPasswordWithToken(token.trim(), newPassword);

    if (!resetResult.success) {
      await recordAuthEvent(token.slice(0, 8), 'password_reset_failed', ip, ua);
      res.status(400).json({
        success: false,
        error: resetResult.error || 'Password reset link is invalid or has expired.',
      });
      return;
    }

    await recordAuthEvent(resetResult.user!.email, 'password_reset_completed', ip, ua);

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You may now sign in with your new credentials.',
    });
  } catch (err: any) {
    console.error('[Admin Password Reset Error]:', err);
    res.status(500).json({ success: false, error: 'An unexpected error occurred while resetting your password.' });
  }
});

// ==========================================
// PROTECTED ADMINISTRATIVE ENDPOINTS
// ==========================================
adminRouter.use('/api/admin', requireAdminAuth);

/**
 * POST /api/admin/auth/logout - Invalidate database session
 */
adminRouter.post('/api/admin/auth/logout', async (req: Request, res: Response) => {
  try {
    const sessionId =
      (req.headers['x-admin-session-id'] as string) ||
      req.adminUser?.sessionId ||
      req.body?.sessionId;

    if (sessionId) {
      await revokeAdminSession(sessionId);
    }

    res.status(200).json({ success: true, message: 'Administrator session revoked.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/auth/me - Current user session info
 */
adminRouter.get('/api/admin/auth/me', (req: Request, res: Response) => {
  if (!req.adminUser || req.adminUser.isSystem) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.status(200).json({
    authenticated: true,
    user: {
      id: req.adminUser.id,
      email: req.adminUser.email,
      name: req.adminUser.name,
      role: req.adminUser.role,
    },
  });
});

/**
 * GET /api/admin/stats - High-level metrics computed via SQL aggregate queries
 */
adminRouter.get(
  '/api/admin/stats',
  requireRole(['owner', 'admin', 'operations_staff', 'viewer', 'content_editor']),
  async (_req: Request, res: Response) => {
    const pool = getDbPool();
    if (!pool) {
      res.status(503).json({ error: 'Database service unavailable' });
      return;
    }

    try {
      const enqStatsPromise = pool.query(`
        SELECT
          COUNT(*)::int as "totalEnquiries",
          COUNT(*) FILTER (WHERE status = 'new')::int as "newEnquiries",
          COUNT(*) FILTER (WHERE status = 'reviewed')::int as "reviewed",
          COUNT(*) FILTER (WHERE status = 'scheduled')::int as "scheduled",
          COUNT(*) FILTER (WHERE email_delivered = FALSE)::int as "failedDeliveries"
        FROM enquiries
      `);

      const handoffStatsPromise = pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending')::int as "pendingHandoffs"
        FROM ai_handoffs
      `);

      const [enqRes, handoffRes] = await Promise.all([enqStatsPromise, handoffStatsPromise]);
      const enqRow = enqRes.rows[0] || {};
      const handoffRow = handoffRes.rows[0] || {};

      res.status(200).json({
        totalEnquiries: enqRow.totalEnquiries || 0,
        newEnquiries: enqRow.newEnquiries || 0,
        reviewed: enqRow.reviewed || 0,
        scheduled: enqRow.scheduled || 0,
        failedDeliveries: enqRow.failedDeliveries || 0,
        pendingHandoffs: handoffRow.pendingHandoffs || 0,
      });
    } catch (err: any) {
      console.error('[Admin Stats SQL Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/admin/enquiries - List enquiries with optional status or service filter
 */
adminRouter.get(
  '/api/admin/enquiries',
  requireRole(['owner', 'admin', 'operations_staff', 'viewer', 'content_editor']),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const service = req.query.service as string | undefined;
      const limit = parseInt((req.query.limit as string) || '50', 10);

      const enquiries = await listEnquiries({ status, service, limit });
      res.status(200).json({ enquiries });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/admin/enquiries/:id - Fetch single enquiry with internal notes
 */
adminRouter.get(
  '/api/admin/enquiries/:id',
  requireRole(['owner', 'admin', 'operations_staff', 'viewer', 'content_editor']),
  async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const enquiry = await getEnquiryById(id);
      if (!enquiry) {
        res.status(404).json({ error: 'Enquiry not found' });
        return;
      }
      res.status(200).json({ enquiry });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * PATCH /api/admin/enquiries/:id/status - Update enquiry status & record internal note
 * Security: Author identity is strictly derived from authenticated server session, never req.body
 */
adminRouter.patch(
  '/api/admin/enquiries/:id/status',
  requireRole(['owner', 'admin', 'operations_staff']),
  async (req: Request, res: Response) => {
    try {
      const { status, note } = req.body;
      const allowed = ['new', 'reviewed', 'quoted', 'scheduled', 'closed'];

      if (!status || !allowed.includes(status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
        return;
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      // Author identity derived securely from session
      const author = req.adminUser
        ? `${req.adminUser.name} (${req.adminUser.role})`
        : 'Administrator';

      const updated = await updateEnquiryStatus(
        id,
        status,
        author,
        note ? String(note).trim() : undefined
      );

      if (!updated) {
        res.status(404).json({ error: 'Enquiry not found' });
        return;
      }

      res.status(200).json({ success: true, enquiry: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/admin/handoffs - Review AI human handoff requests
 */
adminRouter.get(
  '/api/admin/handoffs',
  requireRole(['owner', 'admin', 'operations_staff', 'viewer', 'content_editor']),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const handoffs = await listAiHandoffs(status);
      res.status(200).json({ handoffs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);
