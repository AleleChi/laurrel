import { Router, Request, Response } from 'express';
import { isDbConfigured } from '../database/pool';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'laurrel-backend-api',
    databaseConfigured: isDbConfigured,
    timestamp: new Date().toISOString(),
  });
});
