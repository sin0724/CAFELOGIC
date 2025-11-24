import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { task_id, reviewer_id } = await req.json();

    if (!task_id || !reviewer_id) {
      return NextResponse.json(
        { error: 'Task ID and Reviewer ID are required' },
        { status: 400 }
      );
    }

    // 작업이 declined 상태인지 확인
    const taskCheck = await pool.query(
      'SELECT id, status FROM tasks WHERE id = $1',
      [task_id]
    );

    if (taskCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (taskCheck.rows[0].status !== 'declined') {
      return NextResponse.json(
        { error: 'Only declined tasks can be reassigned' },
        { status: 400 }
      );
    }

    // 리뷰어 존재 확인
    const reviewerCheck = await pool.query(
      'SELECT id FROM reviewers WHERE id = $1',
      [reviewer_id]
    );

    if (reviewerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 404 }
      );
    }

    // 작업을 새 리뷰어에게 재할당하고 pending 상태로 변경
    const result = await pool.query(
      `UPDATE tasks 
       SET reviewer_id = $1, 
           status = 'pending',
           rejection_reason = NULL,
           assigned_at = NOW()
       WHERE id = $2
       RETURNING id, reviewer_id, status`,
      [reviewer_id, task_id]
    );

    return NextResponse.json({ 
      success: true, 
      task: result.rows[0] 
    });
  } catch (error: any) {
    console.error('Reassign task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

