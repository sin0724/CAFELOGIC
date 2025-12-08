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

    // 작업 존재 확인 및 상태 체크
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

    const currentStatus = taskCheck.rows[0].status;
    
    // approved 상태는 이미 완료된 작업이므로 재배분 불가
    if (currentStatus === 'approved') {
      return NextResponse.json(
        { error: 'Approved tasks cannot be reassigned' },
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

    // 작업을 새 리뷰어에게 재할당
    // declined 상태가 아닌 경우 상태는 유지하고, declined인 경우만 pending으로 변경
    const newStatus = currentStatus === 'declined' ? 'pending' : currentStatus;
    const updateQuery = currentStatus === 'declined'
      ? `UPDATE tasks 
         SET reviewer_id = $1, 
             status = $2,
             rejection_reason = NULL,
             assigned_at = NOW()
         WHERE id = $3
         RETURNING id, reviewer_id, status`
      : `UPDATE tasks 
         SET reviewer_id = $1, 
             assigned_at = NOW()
         WHERE id = $2
         RETURNING id, reviewer_id, status`;
    
    const params = currentStatus === 'declined' 
      ? [reviewer_id, newStatus, task_id]
      : [reviewer_id, task_id];
    
    const result = await pool.query(updateQuery, params);

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

