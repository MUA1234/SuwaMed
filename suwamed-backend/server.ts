import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import connectDB from './src/config/database';
import routes from './src/routes';
import { apiLimiter } from './src/middleware/rateLimiter.middleware';
import { mongoSanitize } from './src/middleware/sanitize.middleware';
import errorHandler from './src/middleware/error.middleware';
import logger from './src/utils/logger';
import { startReminderJobs } from './src/services/reminder.service';
import { initSocket } from './src/socket';

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowAllOrigins = allowedOrigins.includes('*');

if (process.env.NODE_ENV === 'production' && (allowedOrigins.length === 0 || allowAllOrigins)) {
  logger.warn(
    'CORS: ALLOWED_ORIGINS is empty or "*" in production. ' +
      'Browser-origin requests will be rejected unless an explicit allowlist is configured. ' +
      'Native mobile clients (no Origin header) are not affected.'
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Native mobile apps, server-to-server calls, and curl have no Origin header.
      // We always let those through — they cannot be the target of a CSRF attack.
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);
app.use(
  helmet({
    // We don't serve a website from this API, so the strictest CSP is fine.
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // HSTS is enforced at the load balancer / host (Render, Railway, Cloudflare, etc.) — leave default.
  })
);

// Per-route body limits. The global default is small; routes that take large
// uploads (Cloudinary multipart) should opt in to a larger limit themselves.
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// Strip Mongo operators ($gt, $where, …) from JSON bodies and route params.
app.use(mongoSanitize);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Rate-limit every /api request. Auth endpoints additionally apply the stricter authLimiter.
app.use('/api', apiLimiter, routes);

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  initSocket(server);
  startReminderJobs();
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

// Only auto-start when invoked directly (npm run dev / npm start).
// On Vercel the file is imported by the serverless handler — don't bind a port.
if (require.main === module) {
  startServer();

  process.on('unhandledRejection', (err: Error) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => {
      process.exit(1);
    });
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    server.close(() => {
      process.exit(1);
    });
  });
}

export default app;
