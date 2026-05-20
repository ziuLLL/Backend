import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import routes from './routes/index';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { sanitizeResponse, sanitizeInput, securityLogger } from './middlewares/security';
import { logger } from './utils/logger';
import { query } from './config/database';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
}));

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    if (allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'))) {
      return cb(null, true);
    }
    cb(new Error('Origem não permitida'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

app.use(securityLogger);
app.use(sanitizeInput);
app.use(sanitizeResponse);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

// ── Auto migrate + seed na inicialização ─────────────
async function initDB() {
  try {
    const check = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      ) as exists
    `);

    if (!check.rows[0].exists) {
      logger.info('Running migrations...');
      const { migrate } = require('./db/migrate');
      await migrate();
      logger.info('Running seed...');
      const { seed } = require('./db/seed');
      await seed();
    } else {
      logger.info('Database already initialized — skipping migration');
    }
  } catch (err) {
    logger.error('DB init error (non-fatal):', err);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`FAETEC API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  await initDB();
});

export default app;
