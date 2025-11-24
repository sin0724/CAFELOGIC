import { NextResponse } from 'next/server';
import { withReviewer } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { task_id, decline_reason } = await req.json();
    const reviewerId = req.user?.userId;

    if (!task_id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // 작업이 해당 리뷰어의 것인지 확인하고, pending 또는 ongoing 상태일 경우에만 declined로 변경
    const result = await pool.query(
      `UPDATE tasks 
       SET status = 'declined', 
           rejection_reason = $1
       WHERE id = $2 AND reviewer_id = $3 
         AND (status = 'pending' OR status = 'ongoing')
       RETURNING id, status`,
      [decline_reason || '리뷰어가 작업을 거절했습니다.', task_id, reviewerId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found, unauthorized, or cannot be declined' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, task: result.rows[0] });
  } catch (error: any) {
    console.error('Decline task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withReviewer(handler);

