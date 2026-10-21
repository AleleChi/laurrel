import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { healthRouter, setBackendReady } from './routes/health';
import { enquireRouter } from './routes/enquire';
import { assistantRouter } from './routes/assistant';
import { adminRouter } from './routes/admin';
import { cmsRouter } from './routes/cms';
import { mediaRouter } from './routes/media';
import { runMigrations } from './database/migrate';
import { bootstrapOwnerAccount } from './database/adminRepo';
import { syncHistoricalEnquiries } from './database/syncData';
import { seedCmsContent } from './database/seedCms';
import { seedMediaAssets } from './database/seedMedia';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);
const host = '0.0.0.0';

// CORS configuration: Allow configured frontend origin, Netlify domains, and local dev
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'https://laurrel.netlify.app',
  'https://laurrel.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server forwarders from Next.js server actions)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some((allowed) => origin === allowed) ||
        origin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin ${origin} is not allowed.`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-admin-token',
      'x-admin-session-id',
      'x-admin-user-id',
      'x-admin-user-email',
      'x-admin-user-name',
      'x-admin-user-role',
    ],
  })
);

app.use(express.json({ limit: '10mb' }));

// Mount static uploads for local storage provider
app.use('/uploads', express.static(path.resolve(__dirname, '../../public/uploads')));

// Mount routes
app.use(healthRouter);
app.use(enquireRouter);
app.use(assistantRouter);
app.use(adminRouter);
app.use(cmsRouter);
app.use(mediaRouter);

// Root informational endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'LAURREL SERVICES — Dedicated Business API',
    status: 'online',
    version: '1.0.0',
    documentation: '/health',
    readiness: '/ready',
  });
});

async function startServer() {
  if (process.env.DATABASE_URL) {
    try {
      console.log('[Startup] Executing controlled database initialization...');
      const migrationRes = await runMigrations();
      if (!migrationRes.success) {
        throw new Error(`Database migration failed: ${migrationRes.message}`);
      }
      console.log('[Startup Migration]:', migrationRes.message);

      await bootstrapOwnerAccount();
      await syncHistoricalEnquiries();
      await seedCmsContent();
      await seedMediaAssets();

      setBackendReady(true, {
        database: 'ready',
        migrations: 'applied',
        storageProvider: process.env.STORAGE_PROVIDER || 'local',
      });
      console.log('[Startup] Backend dependencies initialized and verified ready.');
    } catch (startupErr: any) {
      console.error('[Startup Failure]:', startupErr.message);
      setBackendReady(false, { error: startupErr.message });
      if (process.env.NODE_ENV === 'production') {
        console.error('[CRITICAL] Startup dependency failure in production. /ready will return 503.');
      }
    }
  } else {
    setBackendReady(true, { mode: 'local_no_database' });
  }

  const server = app.listen(port, host, () => {
    console.log(`[LAURREL API] Backend server listening on http://${host}:${port}`);
  });

  return server;
}

startServer();

export default app;
