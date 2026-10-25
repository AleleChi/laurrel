import { Router, Request, Response } from 'express';
import { requireAdminAuth, requireRole } from '../middleware/auth';
import { getDbPool } from '../database/pool';
import { getAppointmentSettings, updateAppointmentSettings } from '../database/settingsRepo';
import {
  listProviderIntegrations,
  getProviderIntegration,
  disconnectProvider,
} from '../database/integrationRepo';
import {
  generateGoogleAuthUrl,
  exchangeGoogleAuthCode,
  getGoogleOAuthConfig,
} from '../services/video/googleCalendarClient';
import crypto from 'crypto';

export const appointmentSettingsRouter = Router();

// ============================================================================
// 1. GET APPOINTMENT SETTINGS & INTEGRATIONS STATUS
// ============================================================================
appointmentSettingsRouter.get(
  '/api/admin/appointments/settings',
  requireAdminAuth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await getAppointmentSettings();
      const integrations = await listProviderIntegrations();
      const googleConfigured = Boolean(getGoogleOAuthConfig());

      res.json({
        success: true,
        settings,
        integrations,
        oauthConfigured: {
          google: googleConfigured,
          ms_teams: false, // Explicitly not automated
          zoom: false,     // Explicitly not automated
        },
      });
    } catch (err: any) {
      console.error('[Admin Settings Get Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to load appointment settings.' });
    }
  }
);

// ============================================================================
// 2. UPDATE APPOINTMENT SETTINGS
// ============================================================================
appointmentSettingsRouter.patch(
  '/api/admin/appointments/settings',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await updateAppointmentSettings(req.body, req.adminUser?.id);
      res.json({
        success: true,
        settings: updated,
        message: 'Appointment configuration updated successfully.',
      });
    } catch (err: any) {
      console.error('[Admin Settings Update Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to update appointment settings.' });
    }
  }
);

// ============================================================================
// 3. GENERATE GOOGLE OAUTH AUTHORIZATION URL WITH SECURE PERSISTENT STATE
// ============================================================================
appointmentSettingsRouter.get(
  '/api/admin/integrations/google/auth-url',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    const pool = getDbPool();
    if (!pool) {
      res.status(500).json({ success: false, error: 'Persistence layer unavailable.' });
      return;
    }

    try {
      const oauthConfig = getGoogleOAuthConfig();
      if (!oauthConfig) {
        res.status(400).json({
          success: false,
          error: 'Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured on server.',
        });
        return;
      }

      const adminUserId = req.adminUser?.id;
      if (!adminUserId) {
        res.status(401).json({ success: false, error: 'Authorized admin session required.' });
        return;
      }

      // Generate single-use high-entropy state token
      const state = crypto.randomBytes(32).toString('hex');
      const fixedRedirectUri = oauthConfig.redirectUri;

      // Persist state in PostgreSQL (survives Render restarts and supports multi-instance backends)
      await pool.query(
        `
        INSERT INTO oauth_states (state, provider, admin_user_id, redirect_uri, expires_at, used)
        VALUES ($1, 'google_meet', $2, $3, NOW() + INTERVAL '10 minutes', FALSE)
        `,
        [state, adminUserId, fixedRedirectUri]
      );

      const url = generateGoogleAuthUrl(state);

      res.json({ success: true, url, state });
    } catch (err: any) {
      console.error('[Google OAuth URL Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to generate Google authorization URL.' });
    }
  }
);

// ============================================================================
// 4. EXCHANGE GOOGLE AUTHORIZATION CODE (VALIDATE STATE & ENFORCE SECURITY)
// ============================================================================
appointmentSettingsRouter.post(
  '/api/admin/integrations/google/exchange',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    const pool = getDbPool();
    if (!pool) {
      res.status(500).json({ success: false, error: 'Persistence layer unavailable.' });
      return;
    }

    const { code, state } = req.body;
    const adminUserId = req.adminUser?.id;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: 'Authorization code is required.' });
      return;
    }

    if (!state || typeof state !== 'string' || state.length < 32) {
      res.status(400).json({ success: false, error: 'Valid OAuth state parameter is required.' });
      return;
    }

    // Atomic validation & consumption of state (prevents replay, enforces admin binding and expiration)
    try {
      const stateRes = await pool.query(
        `
        UPDATE oauth_states
        SET used = TRUE
        WHERE state = $1
          AND provider = 'google_meet'
          AND admin_user_id = $2
          AND used = FALSE
          AND expires_at > NOW()
        RETURNING state, redirect_uri
        `,
        [state, adminUserId]
      );

      if (stateRes.rows.length === 0) {
        res.status(403).json({
          success: false,
          error: 'Invalid, expired, or previously consumed OAuth state. Please restart authorization from Admin Settings.',
        });
        return;
      }

      const recordedRedirectUri = stateRes.rows[0]?.redirect_uri;

      // Exchange code using the exact redirect URI recorded during state creation
      const result = await exchangeGoogleAuthCode(code, recordedRedirectUri);
      res.json({
        success: true,
        message: 'Google Workspace Calendar & Meet connected successfully.',
        accountEmail: result.accountEmail,
      });
    } catch (err: any) {
      console.error('[Google OAuth Exchange Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to complete Google authentication.' });
    }
  }
);

// ============================================================================
// 5. DISCONNECT GOOGLE INTEGRATION
// ============================================================================
appointmentSettingsRouter.post(
  '/api/admin/integrations/google/disconnect',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      await disconnectProvider('google_meet');
      res.json({ success: true, message: 'Google Meet integration disconnected successfully.' });
    } catch (err: any) {
      console.error('[Google Disconnect Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to disconnect Google Meet.' });
    }
  }
);

// ============================================================================
// 6. PROVIDER INTEGRATIONS STATUS
// ============================================================================
appointmentSettingsRouter.get(
  '/api/admin/integrations/status',
  requireAdminAuth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const integrations = await listProviderIntegrations();
      res.json({ success: true, integrations });
    } catch (err: any) {
      console.error('[Integrations Status Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve provider status.' });
    }
  }
);
