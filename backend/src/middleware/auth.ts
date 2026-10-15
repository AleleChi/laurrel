import { Request, Response, NextFunction } from 'express';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.ADMIN_API_SECRET;

  if (!secret) {
    console.error('[Auth Error]: ADMIN_API_SECRET is not configured on the server.');
    res.status(500).json({ error: 'Server authentication is not properly configured.' });
    return;
  }

  const authHeader = req.headers['authorization'];
  const tokenHeader = req.headers['x-admin-token'];

  let token: string | undefined;

  if (typeof tokenHeader === 'string') {
    token = tokenHeader;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token || token !== secret) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing administrator credentials.' });
    return;
  }

  next();
}
