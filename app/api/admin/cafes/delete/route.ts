import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { cafe_ids } = await req.json();

    if (!cafe_ids || !Array.isArray(cafe_ids) || cafe_ids.length === 0) {
      return NextResponse.json(
        { error: 'Cafe IDs are required' },
        { status: 400 }
      );
    }

    // 카페 삭제 (관련 작업이 있으면 CASCADE로 자동 삭제됨)
    const result = await pool.query(
      `DELETE FROM cafes WHERE id = ANY($1::uuid[]) RETURNING id`,
      [cafe_ids]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rows.length,
      deleted_ids: result.rows.map(r => r.id)
    });
  } catch (error: any) {
    console.error('Delete cafes error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

