import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health';
import { enquireRouter } from './routes/enquire';
import { assistantRouter } from './routes/assistant';
import { adminRouter } from './routes/admin';
import { cmsRouter } from './routes/cms';
import { runMigrations } from './database/migrate';
import { bootstrapOwnerAccount } from './database/adminRepo';
import { syncHistoricalEnquiries } from './database/syncData';
import { seedCmsContent } from './database/seedCms';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);
const host = '0.0.0.0';

// CORS configuration: Allow configured frontend origin, Netlify domains, and local dev
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'https://laurrelservices.ca',
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
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
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

// Mount routes
app.use(healthRouter);
app.use(enquireRouter);
app.use(assistantRouter);
app.use(adminRouter);
app.use(cmsRouter);

// Root informational endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'LAURREL SERVICES — Dedicated Business API',
    status: 'online',
    version: '1.0.0',
    documentation: '/health',
  });
});

// Run database migrations, historical sync, bootstrap owner, and seed CMS on startup if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  runMigrations()
    .then(async (res) => {
      console.log('[Startup Migration]:', res.message);
      await bootstrapOwnerAccount();
      await syncHistoricalEnquiries();
      await seedCmsContent();
    })
    .catch((err) => {
      console.warn('[Startup Migration Warning]:', err.message);
    });
}

// Start HTTP server on 0.0.0.0:PORT
const server = app.listen(port, host, () => {
  console.log(`[LAURREL API] Backend server listening on http://${host}:${port}`);
});

export default app;
