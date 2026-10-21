import { Router, Request, Response } from 'express';
import { isDbConfigured, testDbConnection } from '../database/pool';

export const healthRouter = Router();

let isBackendReady = false;
let backendReadinessDetails: Record<string, any> = {
  initialized: false,
};

export function setBackendReady(ready: boolean, details: Record<string, any> = {}) {
  isBackendReady = ready;
  backendReadinessDetails = { ...backendReadinessDetails, ...details, ready };
}

export function getBackendReadiness() {
  return { ready: isBackendReady, details: backendReadinessDetails };
}

// Liveness probe (HTTP 200 confirms process is alive)
healthRouter.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'laurrel-backend-api',
    databaseConfigured: isDbConfigured(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe (HTTP 200 confirms DB connected, migrations applied, dependencies verified)
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  if (!isBackendReady) {
    res.status(503).json({
      status: 'not_ready',
      service: 'laurrel-backend-api',
      error: 'Backend initialization or database dependencies are not yet complete.',
      details: backendReadinessDetails,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Active DB connection ping test
  if (isDbConfigured()) {
    const dbCheck = await testDbConnection();
    if (!dbCheck.connected) {
      res.status(503).json({
        status: 'not_ready',
        service: 'laurrel-backend-api',
        error: 'Database connection check failed during readiness probe.',
        database: dbCheck.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  res.status(200).json({
    status: 'ready',
    service: 'laurrel-backend-api',
    database: isDbConfigured() ? 'connected' : 'unconfigured_local_mode',
    details: backendReadinessDetails,
    timestamp: new Date().toISOString(),
  });
});
