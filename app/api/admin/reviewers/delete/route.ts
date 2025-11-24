import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Reviewer ID is required' },
        { status: 400 }
      );
    }

    // 리뷰어 존재 여부 확인
    const checkResult = await pool.query(
      'SELECT id FROM reviewers WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 404 }
      );
    }

    // 리뷰어 삭제 (CASCADE로 관련 tasks도 자동 삭제됨)
    await pool.query('DELETE FROM reviewers WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete reviewer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

