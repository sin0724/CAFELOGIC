import { NextResponse } from 'next/server';
import { withReviewer } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const reviewerId = req.user?.userId;

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 전체 통계
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing_count,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
      FROM tasks
      WHERE reviewer_id = $1`,
      [reviewerId]
    );

    // 월별 정산 정보
    const settlementsResult = await pool.query(
      `SELECT month, task_count, total_amount
       FROM settlements
       WHERE reviewer_id = $1
       ORDER BY month DESC`,
      [reviewerId]
    );

    // 최근 승인된 작업
    const recentTasksResult = await pool.query(
      `SELECT t.*, c.name as cafe_name
       FROM tasks t
       LEFT JOIN cafes c ON t.cafe_id = c.id
       WHERE t.reviewer_id = $1 AND t.status = 'approved'
       ORDER BY t.approved_at DESC
       LIMIT 10`,
      [reviewerId]
    );

    // 이번달 정산 예정금액 (승인된 날짜 기준)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlySettlementResult = await pool.query(
      `SELECT COALESCE(SUM(settlement_amount), 0) as total_amount
       FROM tasks
       WHERE reviewer_id = $1 
         AND status = 'approved'
         AND approved_at IS NOT NULL
         AND TO_CHAR(approved_at, 'YYYY-MM') = $2`,
      [reviewerId, currentMonth]
    );

    return NextResponse.json({
      stats: statsResult.rows[0],
      settlements: settlementsResult.rows,
      recentTasks: recentTasksResult.rows,
      monthlySettlement: {
        month: currentMonth,
        amount: parseInt(monthlySettlementResult.rows[0]?.total_amount || '0', 10),
      },
    });
  } catch (error) {
    console.error('Get summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withReviewer(handler);

