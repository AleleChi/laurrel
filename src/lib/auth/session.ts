import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export type AdminRole = 'owner' | 'admin' | 'content_editor' | 'operations_staff' | 'viewer';

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AdminSessionPayload {
  user: AdminSessionUser;
  sessionId?: string;
  iat: number;
  exp: number;
}

export const ADMIN_COOKIE_NAME = 'laurrel_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_API_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security Exception]: ADMIN_SESSION_SECRET is required in production.');
    }
    // Safe deterministic development secret (strictly non-production)
    return 'laurrel-development-only-session-secret-local';
  }
  return secret;
}

/**
 * Sign session payload into tamper-proof base64 HMAC token
 */
export function signSessionToken(user: AdminSessionUser, sessionId?: string): string {
  const payload: AdminSessionPayload = {
    user,
    sessionId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const secret = getSessionSecret();
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): AdminSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const secret = getSessionSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Extract and verify admin session from incoming NextRequest
 */
export function getAdminSessionFromRequest(req: NextRequest): AdminSessionPayload | null {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) {
    return null;
  }
  return verifySessionToken(cookie.value);
}

/**
 * Set HttpOnly session cookie on a NextResponse
 */
export function setAdminSessionCookie(
  res: NextResponse,
  user: AdminSessionUser,
  sessionId?: string
): void {
  const token = signSessionToken(user, sessionId);
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clear the admin session cookie on a NextResponse
 */
export function clearAdminSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}
