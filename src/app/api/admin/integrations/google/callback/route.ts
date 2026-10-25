import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth Callback Bridge Route
 * 
 * If Google Cloud Console is configured with /api/admin/integrations/google/callback,
 * this endpoint seamlessly forwards the authorization code, state token, or error
 * parameters to the admin appointments settings page (/admin/appointments/settings)
 * where the administrator session completes the secure token exchange.
 */
export async function GET(req: NextRequest) {
  const search = req.nextUrl.search;
  const redirectTarget = new URL(`/admin/appointments/settings${search}`, req.url);
  return NextResponse.redirect(redirectTarget);
}
