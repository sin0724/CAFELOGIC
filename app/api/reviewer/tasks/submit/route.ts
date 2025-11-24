import { NextResponse } from 'next/server';
import { withReviewer } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { task_id, submit_link } = await req.json();
    const reviewerId = req.user?.userId;

    if (!task_id || !submit_link) {
      return NextResponse.json(
        { error: 'Task ID and submit link are required' },
        { status: 400 }
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

    // 작업 상태 업데이트 (rejection_reason은 선택적으로 NULL로 설정)
    const updateFields = ['status = $1', 'submit_link = $2'];
    const updateValues: any[] = ['submitted', submit_link];
    let paramIndex = 3;

    // rejection_reason 컬럼이 있는지 확인
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'rejection_reason'
    `);

    if (columnCheck.rows.length > 0) {
      updateFields.push(`rejection_reason = $${paramIndex}`);
      updateValues.push(null);
      paramIndex++;
    }

    updateValues.push(task_id);

    await pool.query(
      `UPDATE tasks 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}`,
      updateValues
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Submit task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error.stack },
      { status: 500 }
    );
  }
}

export const POST = withReviewer(handler);

