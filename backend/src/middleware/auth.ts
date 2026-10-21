import { Request, Response, NextFunction } from 'express';
import { AdminRole, verifyAdminSession } from '../database/adminRepo';

export interface AuthenticatedAdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  sessionId?: string;
  isSystem?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AuthenticatedAdminUser;
    }
  }
}

/**
 * Validates administrator authentication:
 * 1. For user-initiated requests: requires valid database session (x-admin-session-id)
 *    and resolves all user identity and permissions strictly from PostgreSQL.
 * 2. Forwarded role headers (e.g. x-admin-user-role) are never trusted as proof of permission.
 * 3. Server-to-server calls with only ADMIN_API_SECRET are assigned a non-interactive 'system' role
 *    and can never impersonate an interactive owner account.
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

  // Gateway secret verification (when provided, token must match configured secret)
  const hasGatewaySecret = Boolean(token && token === secret);

  // If a session ID is supplied, validate it against the database
  if (typeof sessionHeader === 'string' && sessionHeader.trim().length > 0) {
    const verified = await verifyAdminSession(sessionHeader.trim());

    if (!verified) {
      // Session is expired, revoked, or user account is deactivated
      res.status(401).json({
        error: 'Unauthorized: Administrator session is invalid, expired, or revoked.',
      });
      return;
    }

    // Bind authenticated identity directly from verified database record
    req.adminUser = {
      id: verified.user.id,
      email: verified.user.email,
      name: verified.user.name,
      role: verified.user.role,
      sessionId: verified.session.id,
      isSystem: false,
    };

    return next();
  }

  // Non-interactive system operation authentication (gateway token alone without session)
  // Strictly scoped as 'system' - NEVER granted 'owner' or interactive admin identity
  if (hasGatewaySecret) {
    req.adminUser = {
      id: 'system_service',
      email: 'system@laurrelservices.ca',
      name: 'System Service',
      role: 'system' as any,
      isSystem: true,
    };
    return next();
  }

  res.status(401).json({ error: 'Unauthorized: Invalid or missing administrator credentials.' });
}

/**
 * Enforce RBAC permissions
 * Rejects non-interactive system credentials from interactive administrator operations
 */
export function requireRole(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Unauthorized: No active administrator session.' });
      return;
    }

    // System credentials cannot perform interactive administrator operations
    if (req.adminUser.isSystem || req.adminUser.role === ('system' as any)) {
      res.status(403).json({
        error: 'Forbidden: Non-interactive system credentials cannot perform interactive administrator operations.',
      });
      return;
    }

    // Owner role has universal access to administrator endpoints
    if (req.adminUser.role === 'owner') {
      return next();
    }

    if (!allowedRoles.includes(req.adminUser.role)) {
      res.status(403).json({
        error: `Forbidden: Role '${req.adminUser.role}' is not authorized for this operation.`,
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}
