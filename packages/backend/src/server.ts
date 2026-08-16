// ============================================================
//  TAGIT — Express Server Bootstrap
//  Entry point: src/server.ts
// ============================================================

import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { apiRouter } from './routes/index';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { prisma } from './config/database';

const app: Application = express();
const PORT = process.env.PORT ?? 4000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// ── Allowed Origins ──────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

// ── Security Headers ─────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow mobile app image access
  }),
);

// ── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin '${origin}' not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ── Request Logging ───────────────────────────────────────────
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static File Serving (local dev uploads) ───────────────────
const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));

// ── Global Rate Limiting ──────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000), // 15 min
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', limiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'TAGIT Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ── Centralized Error Handler ─────────────────────────────────
app.use(errorMiddleware);

// ── Start Server ──────────────────────────────────────────────
async function startServer(): Promise<void> {
  try {
    // Verify DB connectivity on startup
    await prisma.$connect();
    console.log('✅ Database connected (Supabase / PostgreSQL)');
  } catch (error) {
    console.warn('⚠️ Could not connect to database on startup:', (error as Error).message);
    console.warn('⚠️ Server will start, but database operations may fail until DB is accessible.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 TAGIT API running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
  });
}

// ── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('🔴 SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔴 SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export { app };
