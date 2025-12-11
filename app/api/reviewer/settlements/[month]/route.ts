import { NextResponse } from 'next/server';
import { withReviewer } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any, context: { params: Promise<{ month: string }> | { month: string } }) {
  try {
    const reviewerId = req.user?.userId;
    const params = await Promise.resolve(context.params);
    const month = params.month;

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // 해당 월의 정산 정보 가져오기
    const settlementResult = await pool.query(
      `SELECT month, task_count, total_amount
       FROM settlements
       WHERE reviewer_id = $1 AND month = $2`,
      [reviewerId, month]
    );

    // 해당 월의 승인된 작업 목록 가져오기
    const tasksResult = await pool.query(
      `SELECT 
        t.*,
        c.name as cafe_name,
        COALESCE(c.cafe_link, t.cafe_link) as cafe_link
      FROM tasks t
      LEFT JOIN cafes c ON t.cafe_id = c.id
      WHERE t.reviewer_id = $1 
        AND t.status = 'approved'
        AND t.approved_at IS NOT NULL
        AND TO_CHAR(t.approved_at, 'YYYY-MM') = $2
      ORDER BY t.approved_at DESC`,
      [reviewerId, month]
    );

    return NextResponse.json({
      settlement: settlementResult.rows[0] || null,
      tasks: tasksResult.rows,
      month,
    });
  } catch (error) {
    console.error('Get settlement detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withReviewer(handler);
