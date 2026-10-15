import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health';
import { enquireRouter } from './routes/enquire';
import { assistantRouter } from './routes/assistant';
import { adminRouter } from './routes/admin';
import { runMigrations } from './database/migrate';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);
const host = '0.0.0.0';

// CORS configuration: Allow configured frontend origin and local dev
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'https://laurrelservices.ca',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server forwarders)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowed) => origin === allowed || origin.endsWith('.netlify.app'))) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in initial stage, secure endpoints protected by tokens
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  })
);

app.use(express.json({ limit: '1mb' }));

// Mount routes
app.use(healthRouter);
app.use(enquireRouter);
app.use(assistantRouter);
app.use(adminRouter);

// Root informational endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'LAURREL SERVICES — Dedicated Business API',
    status: 'online',
    version: '1.0.0',
    documentation: '/health',
  });
});

// Run database migrations on startup if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  runMigrations()
    .then((res) => {
      console.log('[Startup Migration]:', res.message);
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
