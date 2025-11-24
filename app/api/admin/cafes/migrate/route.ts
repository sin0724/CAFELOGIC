import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler() {
  try {
    // region, cafe_link 컬럼 추가 (이미 있으면 에러 무시)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'cafes' AND column_name = 'region'
        ) THEN
          ALTER TABLE cafes ADD COLUMN region TEXT;
          CREATE INDEX IF NOT EXISTS idx_cafes_region ON cafes(region);
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

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully' 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);

