import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler() {
  try {
    // 모든 카페 삭제 (관련 작업이 있으면 CASCADE로 자동 삭제됨)
    const result = await pool.query('DELETE FROM cafes RETURNING id');

    return NextResponse.json({
      success: true,
      deleted: result.rows.length
    });
  } catch (error: any) {
    console.error('Delete all cafes error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

