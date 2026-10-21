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
// In production, missing DATABASE_URL or failed dependencies MUST result in HTTP 503.
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. In production, missing database configuration immediately fails readiness
  if (isProduction && !isDbConfigured()) {
    res.status(503).json({
      status: 'not_ready',
      service: 'laurrel-backend-api',
      error: 'DATABASE_URL is not configured in production environment. Backend cannot serve traffic.',
      details: backendReadinessDetails,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 2. Check if startup initialization (migrations, bootstrapping) succeeded
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

  // 3. In production, local_no_database mode is strictly forbidden from reporting ready
  if (isProduction && backendReadinessDetails.mode === 'local_no_database') {
    res.status(503).json({
      status: 'not_ready',
      service: 'laurrel-backend-api',
      error: 'Production environment cannot report ready in local_no_database mode.',
      details: backendReadinessDetails,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 4. Active DB connection ping test
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
