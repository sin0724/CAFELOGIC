import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Railway에서는 DATABASE_PUBLIC_URL을 우선 사용 (배포된 앱에서 접근 가능)
const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Railway PostgreSQL은 SSL이 필요합니다
  ssl: connectionString?.includes('railway') || connectionString?.includes('rlwy.net')
    ? { rejectUnauthorized: false } 
    : process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});

export default pool;

// 데이터베이스 스키마 초기화 함수
export async function initDatabase() {
  const client = await pool.connect();
  try {
    // reviewers 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviewers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nickname TEXT,
        unit_price INTEGER DEFAULT 3000,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // admins 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // cafes 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS cafes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        region TEXT,
        cafe_link TEXT NOT NULL,
        allow_review BOOLEAN DEFAULT true,
        allow_business_name BOOLEAN DEFAULT true,
        allow_after_post BOOLEAN DEFAULT true,
        require_approval BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // region, cafe_link 컬럼이 없으면 추가 (기존 데이터베이스 마이그레이션)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'cafes' AND column_name = 'region'
        ) THEN
          ALTER TABLE cafes ADD COLUMN region TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'cafes' AND column_name = 'cafe_link'
        ) THEN
          ALTER TABLE cafes ADD COLUMN cafe_link TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'tasks' AND column_name = 'rejection_reason'
        ) THEN
          ALTER TABLE tasks ADD COLUMN rejection_reason TEXT;
        END IF;
      END $$;
    `);

    // region 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cafes_region ON cafes(region);
    `);

    // tasks 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reviewer_id UUID REFERENCES reviewers(id) ON DELETE CASCADE,
        cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
        task_type TEXT NOT NULL,
        assigned_at TIMESTAMP DEFAULT NOW(),
        deadline DATE,
        cafe_link TEXT,
        business_name TEXT,
        place_address TEXT,
        need_photo BOOLEAN DEFAULT false,
        special_note TEXT,
        title_guide TEXT,
        content_guide TEXT,
        comment_guide TEXT,
        submit_link TEXT,
        status TEXT DEFAULT 'pending',
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        settlement_amount INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // settlements 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reviewer_id UUID REFERENCES reviewers(id) ON DELETE CASCADE,
        month TEXT NOT NULL,
        task_count INTEGER DEFAULT 0,
        total_amount INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(reviewer_id, month)
      )
    `);

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_reviewer_id ON tasks(reviewer_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_cafe_id ON tasks(cafe_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_settlements_reviewer_month ON settlements(reviewer_id, month);
    `);

    // 기본 관리자 계정 생성 (비밀번호: 250801)
    const adminPasswordHash = await bcrypt.hash('250801', 10);
    
    await client.query(`
      INSERT INTO admins (username, password_hash)
      VALUES ('admin', $1)
      ON CONFLICT (username) DO NOTHING
    `, [adminPasswordHash]);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

