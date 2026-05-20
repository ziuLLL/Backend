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

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ── Trust proxy (Railway fica atrás de proxy) ─────────
app.set('trust proxy', 1);

// ── Security headers (Helmet) ─────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
}));

// ── CORS restrito ao frontend ─────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Permite requisições sem origin (mobile apps, Postman em dev)
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    if (allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'))) {
      return cb(null, true);
    }
    logger.warn(`CORS blocked: ${origin}`);
    cb(new Error('Origem não permitida'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ── Rate limit global ─────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Parsing & compressão ──────────────────────────────
app.use(compression());
app.use(express.json({ limit: '100kb' })); // Limita tamanho do body
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Logging ───────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  // Não loga Authorization header (esconde tokens nos logs)
  skip: () => false,
}));

// ── Security middlewares ──────────────────────────────
app.use(securityLogger);   // Detecta SQL injection, XSS, path traversal
app.use(sanitizeInput);    // Remove inputs maliciosos
app.use(sanitizeResponse); // Remove campos sensíveis das respostas

// ── Rotas ─────────────────────────────────────────────
app.use('/api', routes);

// ── 404 & Error handlers ──────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`FAETEC API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

export default app;
