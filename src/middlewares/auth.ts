import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    // Verifica formato exato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Token muito curto = claramente inválido
    if (!token || token.length < 20) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Erro de configuração do servidor' });
      return;
    }

    const decoded = jwt.verify(token, secret) as { userId: string; email: string; iat: number; exp: number };

    // Verifica se token não é muito antigo (7 dias)
    const maxAge = 7 * 24 * 60 * 60;
    if (Date.now() / 1000 - decoded.iat > maxAge) {
      res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
      return;
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    logger.warn('Auth error:', error);
    res.status(401).json({ error: 'Falha na autenticação' });
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.length >= 20) {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as { userId: string; email: string };
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
      }
    }
  } catch { /* token inválido = ignora, não bloqueia */ }
  next();
};
