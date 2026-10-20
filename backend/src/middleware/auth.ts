import { Request, Response, NextFunction } from 'express';
import { AdminRole, verifyAdminSession } from '../database/adminRepo';

export interface AuthenticatedAdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AuthenticatedAdminUser;
    }
  }
}

/**
 * Validates either:
 * 1. Server-to-server gateway token (x-admin-token === ADMIN_API_SECRET), with optional session forwarding headers
 * 2. Direct session token in x-admin-session-id
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const secret = process.env.ADMIN_API_SECRET;

  if (!secret) {
    console.error('[Auth Error]: ADMIN_API_SECRET is not configured on the server.');
    res.status(500).json({ error: 'Server authentication is not properly configured.' });
    return;
  }

  const authHeader = req.headers['authorization'];
  const tokenHeader = req.headers['x-admin-token'];
  const sessionHeader = req.headers['x-admin-session-id'];

  let token: string | undefined;
  if (typeof tokenHeader === 'string') {
    token = tokenHeader;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // Check 1: Direct session token validation
  if (typeof sessionHeader === 'string' && sessionHeader.startsWith('sess_')) {
    const verified = await verifyAdminSession(sessionHeader);
    if (verified) {
      req.adminUser = {
        id: verified.user.id,
        email: verified.user.email,
        name: verified.user.name,
        role: verified.user.role,
        sessionId: verified.session.id,
      };
      return next();
    }
  }

  // Check 2: Gateway token validation (from Next.js server-side API proxy)
  if (token && token === secret) {
    // If Next.js forwarded authenticated user identity headers, bind them
    const forwardedId = req.headers['x-admin-user-id'] as string | undefined;
    const forwardedEmail = req.headers['x-admin-user-email'] as string | undefined;
    const forwardedName = req.headers['x-admin-user-name'] as string | undefined;
    const forwardedRole = req.headers['x-admin-user-role'] as AdminRole | undefined;
    const forwardedSessionId = req.headers['x-admin-session-id'] as string | undefined;

    if (forwardedId && forwardedRole) {
      req.adminUser = {
        id: forwardedId,
        email: forwardedEmail || '',
        name: forwardedName || 'Administrator',
        role: forwardedRole,
        sessionId: forwardedSessionId,
      };
    } else {
      // Default to owner/system for direct secret calls if no user forwarded
      req.adminUser = {
        id: 'system_gateway',
        email: 'system@laurrelservices.ca',
        name: 'System Gateway',
        role: 'owner',
      };
    }

    return next();
  }

  res.status(401).json({ error: 'Unauthorized: Invalid or missing administrator credentials.' });
}

/**
 * Enforce RBAC permissions
 */
export function requireRole(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Unauthorized: No active administrator session.' });
      return;
    }

    if (!allowedRoles.includes(req.adminUser.role) && req.adminUser.role !== 'owner') {
      res.status(403).json({
        error: `Forbidden: Role '${req.adminUser.role}' is not authorized for this operation.`,
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}
