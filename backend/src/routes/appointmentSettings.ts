import { Router, Request, Response } from 'express';
import { requireAdminAuth, requireRole } from '../middleware/auth';
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

// Store temporary OAuth states in memory with 10-minute expiry
const oauthStates = new Map<string, number>();

function cleanExpiredStates() {
  const now = Date.now();
  for (const [state, timestamp] of oauthStates.entries()) {
    if (now - timestamp > 10 * 60 * 1000) {
      oauthStates.delete(state);
    }
  }
}

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
          ms_teams: false,
          zoom: false,
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
// 3. GENERATE GOOGLE OAUTH AUTHORIZATION URL
// ============================================================================
appointmentSettingsRouter.get(
  '/api/admin/integrations/google/auth-url',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      cleanExpiredStates();
      const state = crypto.randomBytes(24).toString('hex');
      oauthStates.set(state, Date.now());

      const redirectUri = req.query.redirectUri as string | undefined;
      const url = generateGoogleAuthUrl(state, redirectUri);

      res.json({ success: true, url, state });
    } catch (err: any) {
      console.error('[Google OAuth URL Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to generate Google authorization URL.' });
    }
  }
);

// ============================================================================
// 4. EXCHANGE GOOGLE AUTHORIZATION CODE
// ============================================================================
appointmentSettingsRouter.post(
  '/api/admin/integrations/google/exchange',
  requireAdminAuth,
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    const { code, state, redirectUri } = req.body;

    if (!code) {
      res.status(400).json({ success: false, error: 'Authorization code is required.' });
      return;
    }

    if (state && !oauthStates.has(state)) {
      console.warn('[Google OAuth Warning] Unrecognized or expired OAuth state parameter.');
    }
    if (state) oauthStates.delete(state);

    try {
      const result = await exchangeGoogleAuthCode(code, redirectUri);
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
      res.status(500).json({ success: false, error: 'Failed to retrieve provider integration statuses.' });
    }
  }
);
