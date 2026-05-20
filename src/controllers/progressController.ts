import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';

// ─── PROGRESS ──────────────────────────────────────────────────────────────────
export const getUserProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;

    const [userResult, progressResult, recentResult, weekResult] = await Promise.all([
      query('SELECT id, name, email, xp, level, streak, badges, last_study_date, study_days FROM users WHERE id = $1', [userId]),
      query('SELECT subject, topic, total_answered, total_correct FROM progress WHERE user_id = $1 ORDER BY subject, topic', [userId]),
      query(
        `SELECT q.subject, q.topic, a.is_correct, a.xp_earned, a.answered_at
         FROM answers a JOIN questions q ON a.question_id = q.id
         WHERE a.user_id = $1 ORDER BY a.answered_at DESC LIMIT 20`,
        [userId]
      ),
      query(
        `SELECT DATE(answered_at) as day, COUNT(*) as count, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
         FROM answers WHERE user_id = $1 AND answered_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(answered_at) ORDER BY day`,
        [userId]
      ),
    ]);

    if (userResult.rows.length === 0) throw new AppError(404, 'Usuário não encontrado');

    const user = userResult.rows[0];
    const progress = progressResult.rows;
    const totalAnswered = progress.reduce((a: number, p: any) => a + Number(p.total_answered), 0);
    const totalCorrect = progress.reduce((a: number, p: any) => a + Number(p.total_correct), 0);

    // Weak subjects
    const bySubject: Record<string, { total: number; correct: number }> = {};
    progress.forEach((p: any) => {
      if (!bySubject[p.subject]) bySubject[p.subject] = { total: 0, correct: 0 };
      bySubject[p.subject].total += Number(p.total_answered);
      bySubject[p.subject].correct += Number(p.total_correct);
    });

    res.json({
      user,
      stats: {
        totalAnswered,
        totalCorrect,
        accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
        bySubject,
      },
      progress,
      recentActivity: recentResult.rows,
      weeklyActivity: weekResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

// ─── RANKING ──────────────────────────────────────────────────────────────────
export const getRanking = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.xp, u.level, u.streak,
         COUNT(a.id) as total_answered,
         SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as total_correct
       FROM users u
       LEFT JOIN answers a ON u.id = a.user_id
       GROUP BY u.id, u.name, u.xp, u.level, u.streak
       ORDER BY u.xp DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// ─── VIDEOS ──────────────────────────────────────────────────────────────────
export const getVideos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject } = req.query;
    let sql = 'SELECT * FROM videos';
    const params: unknown[] = [];
    if (subject) { sql += ' WHERE subject = $1'; params.push(subject); }
    sql += ' ORDER BY subject, order_index';
    const result = await query(sql, params);

    // If authenticated, get watch progress
    let watchedIds: string[] = [];
    if (req.userId) {
      const wp = await query(
        'SELECT video_id, completed, watched_seconds, notes FROM video_progress WHERE user_id = $1',
        [req.userId]
      );
      watchedIds = wp.rows.map((r: any) => r.video_id);
      const videos = result.rows.map((v: any) => ({
        ...v,
        userProgress: wp.rows.find((w: any) => w.video_id === v.id) || null,
      }));
      res.json(videos);
      return;
    }

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const updateVideoProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { watchedSeconds = 0, completed = false, notes = '' } = req.body;
    const userId = req.userId!;

    await query(
      `INSERT INTO video_progress (user_id, video_id, watched_seconds, completed, notes, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, video_id) DO UPDATE SET
         watched_seconds = $3, completed = $4, notes = $5,
         completed_at = CASE WHEN $4 THEN NOW() ELSE video_progress.completed_at END`,
      [userId, videoId, watchedSeconds, completed, notes, completed ? new Date() : null]
    );

    if (completed) {
      await query('UPDATE users SET xp = xp + 30, updated_at = NOW() WHERE id = $1', [userId]);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── THEORY ──────────────────────────────────────────────────────────────────
export const getTheory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject } = req.query;
    let sql = 'SELECT * FROM theory';
    const params: unknown[] = [];
    if (subject) { sql += ' WHERE subject = $1'; params.push(subject); }
    sql += ' ORDER BY subject, order_index';
    const result = await query(sql, params);

    if (req.userId) {
      const tp = await query(
        'SELECT theory_id, completed FROM theory_progress WHERE user_id = $1',
        [req.userId]
      );
      const theories = result.rows.map((t: any) => ({
        ...t,
        completed: tp.rows.some((p: any) => p.theory_id === t.id && p.completed),
      }));
      res.json(theories);
      return;
    }

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const markTheoryComplete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { theoryId } = req.params;
    const userId = req.userId!;

    const existing = await query(
      'SELECT id, completed FROM theory_progress WHERE user_id = $1 AND theory_id = $2',
      [userId, theoryId]
    );

    if (existing.rows.length > 0 && existing.rows[0].completed) {
      res.json({ success: true, alreadyCompleted: true });
      return;
    }

    await query(
      `INSERT INTO theory_progress (user_id, theory_id, completed, completed_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (user_id, theory_id) DO UPDATE SET completed = true, completed_at = NOW()`,
      [userId, theoryId]
    );

    await query('UPDATE users SET xp = xp + 80, updated_at = NOW() WHERE id = $1', [userId]);

    res.json({ success: true, xpEarned: 80 });
  } catch (error) {
    next(error);
  }
};
