import { NextResponse } from 'next/server';
import { withReviewer } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { task_id } = await req.json();
    const reviewerId = req.user?.userId;

    if (!task_id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 작업이 해당 리뷰어의 것인지 확인
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND reviewer_id = $2',
      [task_id, reviewerId]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    const task = taskResult.rows[0];

    // pending 상태인 경우에만 ongoing으로 변경
    if (task.status === 'pending') {
      await pool.query(
        `UPDATE tasks SET status = 'ongoing' WHERE id = $1`,
        [task_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Start task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withReviewer(handler);

