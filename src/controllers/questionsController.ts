import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middlewares/errorHandler';

const questionSelect = `
  SELECT id, subject, topic, difficulty, incidence, statement, options, correct_index, explanation, exam_board, exam_year, tags
  FROM questions
`;

export const getAllQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, topic, difficulty, limit = '20', offset = '0' } = req.query;
    let sql = questionSelect + ' WHERE 1=1';
    const params: unknown[] = [];

    if (subject) { params.push(subject); sql += ` AND subject = $${params.length}`; }
    if (topic) { params.push(topic); sql += ` AND topic = $${params.length}`; }
    if (difficulty) { params.push(difficulty); sql += ` AND difficulty = $${params.length}`; }

    sql += ` ORDER BY RANDOM() LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getMathQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '20', difficulty } = req.query;
    const params: unknown[] = ['Matemática', Number(limit)];
    let sql = questionSelect + ' WHERE subject = $1';
    if (difficulty) { params.splice(1, 0, difficulty); sql += ` AND difficulty = $2 LIMIT $3`; }
    else sql += ' ORDER BY RANDOM() LIMIT $2';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getPortugueseQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '20', difficulty } = req.query;
    const params: unknown[] = ['Português', Number(limit)];
    let sql = questionSelect + ' WHERE subject = $1';
    if (difficulty) { params.splice(1, 0, difficulty); sql += ` AND difficulty = $2 LIMIT $3`; }
    else sql += ' ORDER BY RANDOM() LIMIT $2';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getTopics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      'SELECT subject, topic, COUNT(*) as count FROM questions GROUP BY subject, topic ORDER BY subject, topic'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(questionSelect + ' WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw new AppError(404, 'Questão não encontrada');
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
