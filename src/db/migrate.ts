import 'dotenv/config';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const migrations = [
  `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `,
  `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    last_study_date DATE,
    study_days TEXT[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(50) NOT NULL CHECK (subject IN ('Português', 'Matemática')),
    topic VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Fácil', 'Médio', 'Difícil')),
    incidence VARCHAR(30) DEFAULT 'Alta',
    statement TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    exam_year INTEGER,
    exam_board VARCHAR(50) DEFAULT 'FAETEC/COSEAC',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    total_answered INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subject, topic)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS theory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    common_errors TEXT[],
    examples TEXT[],
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS theory_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theory_id UUID NOT NULL REFERENCES theory(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, theory_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(50) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    youtube_id VARCHAR(30) NOT NULL,
    duration VARCHAR(10),
    professor VARCHAR(100),
    thumbnail_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS video_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    UNIQUE(user_id, video_id)
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
  CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
  CREATE INDEX IF NOT EXISTS idx_answers_answered_at ON answers(answered_at);
  CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
  CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `,
];

export async function migrate() {
  logger.info('Starting database migration...');
  for (const sql of migrations) {
    await query(sql);
  }
  logger.info('Migration completed successfully');
}

// Permite rodar direto: tsx src/db/migrate.ts
if (require.main === module) {
  migrate().then(() => process.exit(0)).catch((err) => {
    logger.error('Migration failed:', err);
    process.exit(1);
  });
}
