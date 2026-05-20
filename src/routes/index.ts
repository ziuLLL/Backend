import { Router } from 'express';
import * as auth from '../controllers/authController';
import * as questions from '../controllers/questionsController';
import * as answers from '../controllers/answersController';
import * as progress from '../controllers/progressController';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { authRateLimit, answerRateLimit } from '../middlewares/security';

const router = Router();

// ── Auth (rate limit agressivo) ───────────────────────
router.post('/auth/register', authRateLimit, auth.register);
router.post('/auth/login', authRateLimit, auth.login);
router.get('/auth/me', authenticate, auth.me);

// ── Questions (públicas, com cache) ───────────────────
router.get('/questions', questions.getAllQuestions);
router.get('/questions/math', questions.getMathQuestions);
router.get('/questions/portuguese', questions.getPortugueseQuestions);
router.get('/questions/topics', questions.getTopics);
router.get('/questions/:id', questions.getQuestionById);

// ── Answers (autenticado + rate limit anti-spam) ──────
router.post('/answer', authenticate, answerRateLimit, answers.submitAnswer);

// ── Progress (autenticado) ────────────────────────────
router.get('/user/progress', authenticate, progress.getUserProgress);

// ── Ranking (opcional auth) ───────────────────────────
router.get('/ranking', optionalAuth, progress.getRanking);

// ── Videos ───────────────────────────────────────────
router.get('/videos', optionalAuth, progress.getVideos);
router.patch('/videos/:videoId/progress', authenticate, progress.updateVideoProgress);

// ── Theory ───────────────────────────────────────────
router.get('/theory', optionalAuth, progress.getTheory);
router.post('/theory/:theoryId/complete', authenticate, progress.markTheoryComplete);

// ── Health (sem dados sensíveis) ──────────────────────
router.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default router;
