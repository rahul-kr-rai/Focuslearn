import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { generalLimiter } from './middleware/rateLimiter.js';
import sanitizeInput from './middleware/sanitize.js';
import errorHandler from './middleware/errorHandler.js';
import env from './config/env.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import takedownRoutes from './routes/takedownRoutes.js';

const app = express();

// Trust reverse proxy (Render, Vercel, Nginx, Cloudflare)
app.set('trust proxy', 1);

// ──────────────────────────────────────────────
// Security & Parsing Middleware
// ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Dynamic, secure CORS configuration
const allowedOrigins = [
  env.CLIENT_URL?.replace(/\/$/, ''),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        (env.NODE_ENV !== 'production' && normalizedOrigin.includes('localhost')) ||
        normalizedOrigin.endsWith('.vercel.app');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '2mb' })); // Reduced from 10mb to prevent memory exhaustion
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// NoSQL operator injection sanitizer
app.use(sanitizeInput);

// Request logging (skip in test environment)
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// General rate limiter
app.use('/api/', generalLimiter);

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/takedown', takedownRoutes);

// ──────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'FocusLearn API is running securely',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ──────────────────────────────────────────────
// 404 Handler
// ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// ──────────────────────────────────────────────
// Global Error Handler (must be last)
// ──────────────────────────────────────────────
app.use(errorHandler);

export default app;
