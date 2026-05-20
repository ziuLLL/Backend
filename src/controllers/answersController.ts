import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedIndex: z.number().int().min(0).max(3),
});

function calcXp(difficulty: string, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return difficulty === 'Difícil' ? 30 : difficulty === 'Médio' ? 20 : 10;
}

function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

const XP_BADGES: Record<string, { xp: number; name: string }> = {
  first_q: { xp: 0, name: 'Primeira Questão' },
  streak_3: { xp: 0, name: '3 Dias de Streak' },
  streak_7: { xp: 0, name: '7 Dias Imparável' },
  port_50: { xp: 0, name: '50 Questões de Português' },
  mat_50: { xp: 0, name: '50 Questões de Matemática' },
  perfect_10: { xp: 0, name: '10 Acertos Seguidos' },
};

export const submitAnswer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { questionId, selectedIndex } = answerSchema.parse(req.body);
    const userId = req.userId!;

    // Get question
    const qResult = await query(
      'SELECT id, subject, topic, difficulty, correct_index FROM questions WHERE id = $1',
      [questionId]
    );
    if (qResult.rows.length === 0) throw new AppError(404, 'Questão não encontrada');
    const question = qResult.rows[0];

    const isCorrect = selectedIndex === question.correct_index;
    const xpEarned = calcXp(question.difficulty, isCorrect);

    // Record answer
    await query(
      `INSERT INTO answers (user_id, question_id, selected_index, is_correct, xp_earned)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, questionId, selectedIndex, isCorrect, xpEarned]
    );

    // Update progress table
    await query(
      `INSERT INTO progress (user_id, subject, topic, total_answered, total_correct)
       VALUES ($1, $2, $3, 1, $4)
       ON CONFLICT (user_id, subject, topic)
       DO UPDATE SET
         total_answered = progress.total_answered + 1,
         total_correct = progress.total_correct + $4,
         updated_at = NOW()`,
      [userId, question.subject, question.topic, isCorrect ? 1 : 0]
    );

    // Update user XP, level, streak
    const userResult = await query(
      'SELECT xp, level, streak, last_study_date, badges, study_days FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    const newXp = user.xp + xpEarned;
    const newLevel = calcLevel(newXp);

    // Streak logic
    const today = new Date().toISOString().split('T')[0];
    const lastStudy = user.last_study_date ? new Date(user.last_study_date).toISOString().split('T')[0] : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = user.streak;
    let studyDays: string[] = user.study_days || [];

    if (lastStudy !== today) {
      newStreak = lastStudy === yesterday ? user.streak + 1 : 1;
      studyDays = [...studyDays, today];
    }

    // Badge checks
    const currentBadges: string[] = user.badges || [];
    const newBadges: string[] = [...currentBadges];

    const totalAnswered = await query('SELECT COUNT(*) FROM answers WHERE user_id = $1', [userId]);
    const total = parseInt(totalAnswered.rows[0].count);
    if (total === 1 && !newBadges.includes('first_q')) newBadges.push('first_q');
    if (newStreak >= 3 && !newBadges.includes('streak_3')) newBadges.push('streak_3');
    if (newStreak >= 7 && !newBadges.includes('streak_7')) newBadges.push('streak_7');

    const portCount = await query(
      "SELECT COUNT(*) FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.user_id = $1 AND q.subject = 'Português'",
      [userId]
    );
    if (parseInt(portCount.rows[0].count) >= 50 && !newBadges.includes('port_50')) newBadges.push('port_50');

    const mathCount = await query(
      "SELECT COUNT(*) FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.user_id = $1 AND q.subject = 'Matemática'",
      [userId]
    );
    if (parseInt(mathCount.rows[0].count) >= 50 && !newBadges.includes('mat_50')) newBadges.push('mat_50');

    await query(
      `UPDATE users SET xp = $1, level = $2, streak = $3, last_study_date = $4, badges = $5, study_days = $6, updated_at = NOW()
       WHERE id = $7`,
      [newXp, newLevel, newStreak, today, newBadges, studyDays, userId]
    );

    const earnedNewBadges = newBadges.filter(b => !currentBadges.includes(b));

    res.json({
      isCorrect,
      correctIndex: question.correct_index,
      xpEarned,
      newXp,
      newLevel,
      newStreak,
      newBadges: earnedNewBadges,
    });
  } catch (error) {
    next(error);
  }
};
