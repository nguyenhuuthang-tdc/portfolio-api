import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import sequelize from './config/database';
import { swaggerSpec } from './config/swagger';
import { errorMiddleware } from './middleware/error.middleware';

import apiRouter from './routes/api.router';

import { startViewCountJob } from './jobs/viewCount.job';
import { startAuthSessionCleanupJob } from './jobs/authSessionCleanup.job';
import { runMigrations } from './migrations/runner';

const app = express();

const configuredTrustProxy = process.env.TRUST_PROXY;
if (configuredTrustProxy !== undefined) {
  const numericTrustProxy = Number(configuredTrustProxy);
  app.set('trust proxy', Number.isNaN(numericTrustProxy) ? configuredTrustProxy : numericTrustProxy);
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security & parsing middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger (non-production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
}
// Always expose JSON spec for FE sync
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use(errorMiddleware);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Schema is currently stable — skip auto-sync on every `npm run dev`.
    // Re-enable when models change: await sequelize.sync({ alter: true });
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synced');
    }

    await runMigrations();

    startViewCountJob();
    startAuthSessionCleanupJob();

    const port = Number(process.env.PORT) || 4000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`Swagger UI: http://localhost:${port}/api-docs`);
      console.log(`Swagger JSON: http://localhost:${port}/api-docs.json`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

export default app;
