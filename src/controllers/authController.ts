import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const registerSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

function generateToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign({ userId, email }, secret, { expiresIn: '7d' } as any);
}

// Tempo constante para evitar timing attacks
async function safeCompare(a: string, b: string): Promise<boolean> {
  return bcrypt.compare(a, b);
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Verifica existência sem revelar se email existe (timing-safe)
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      // Não revela que o email já existe — mesma mensagem genérica
      throw new AppError(409, 'Não foi possível criar a conta. Tente outro email.');
    }

    // Hash com custo 12 (seguro contra brute force)
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, xp, level, streak, badges, created_at`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, email);

    // Log sem expor email completo
    logger.info(`New user registered: ${email.replace(/(.{2}).*@/, '$1***@')}`);

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query(
      // Nunca retorna password_hash para o cliente
      'SELECT id, name, password_hash, xp, level, streak, badges, last_study_date FROM users WHERE email = $1',
      [email]
    );

    // Sempre executa o bcrypt mesmo se usuário não existe (evita timing attack)
    const fakeHash = '$2b$12$invalidhashtopreventtimingattack000000000000000000000';
    const hash = result.rows[0]?.password_hash || fakeHash;
    const valid = await safeCompare(password, hash);

    if (result.rows.length === 0 || !valid) {
      // Mensagem genérica — não revela se email existe ou não
      throw new AppError(401, 'Email ou senha incorretos');
    }

    const user = result.rows[0];
    const { password_hash, ...safeUser } = user;
    const token = generateToken(user.id, email);

    logger.info(`User logged in: ${email.replace(/(.{2}).*@/, '$1***@')}`);
    res.json({ token, user: safeUser });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      // Nunca retorna password_hash
      'SELECT id, name, email, xp, level, streak, badges, last_study_date, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) throw new AppError(404, 'Usuário não encontrado');
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
