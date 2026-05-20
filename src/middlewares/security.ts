import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ── Bloqueia campos sensíveis nas respostas ───────────
export function sanitizeResponse(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    if (data && typeof data === 'object') {
      data = removeSensitiveFields(data);
    }
    return originalJson(data);
  };
  next();
}

function removeSensitiveFields(obj: any): any {
  if (Array.isArray(obj)) return obj.map(removeSensitiveFields);
  if (obj && typeof obj === 'object') {
    const clean = { ...obj };
    const blocked = ['password', 'password_hash', 'secret', 'token_internal'];
    blocked.forEach(f => delete clean[f]);
    Object.keys(clean).forEach(k => {
      if (clean[k] && typeof clean[k] === 'object') {
        clean[k] = removeSensitiveFields(clean[k]);
      }
    });
    return clean;
  }
  return obj;
}

// ── Rate limit agressivo para auth ───────────────────
import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login/cadastro por IP
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit on auth: IP ${req.ip}`);
    res.status(429).json({ error: 'Muitas tentativas de login. Aguarde 15 minutos.' });
  },
});

export const answerRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 respostas por minuto por IP
  message: { error: 'Muitas requisições. Aguarde um momento.' },
});

// ── Detecta e bloqueia inputs maliciosos ─────────────
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const suspicious = /<script|javascript:|on\w+=/i;
  const check = (val: any): boolean => {
    if (typeof val === 'string') return suspicious.test(val);
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).some(v => check(v));
    }
    return false;
  };
  if (check(req.body) || check(req.query)) {
    logger.warn(`Suspicious input blocked: IP ${req.ip} URL ${req.url}`);
    res.status(400).json({ error: 'Entrada inválida detectada' });
    return;
  }
  next();
}

// ── Log de requisições suspeitas ──────────────────────
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const suspicious = [
    '../', '..\\', '/etc/passwd', '/proc/', 'SELECT ', 'DROP ', 'INSERT ',
    'UNION ', '--', '/*', 'xp_cmd', '<script',
  ];
  const url = req.url.toLowerCase();
  const body = JSON.stringify(req.body || '').toLowerCase();
  const isSuspicious = suspicious.some(s => url.includes(s.toLowerCase()) || body.includes(s.toLowerCase()));
  if (isSuspicious) {
    logger.warn(`Security alert: IP=${req.ip} URL=${req.url} Body=${body.slice(0, 200)}`);
    res.status(400).json({ error: 'Requisição inválida' });
    return;
  }
  next();
}
