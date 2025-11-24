import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { task_id, rejection_reason } = await req.json();

    if (!task_id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // rejection_reason 컬럼이 있는지 확인
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'rejection_reason'
    `);

    if (columnCheck.rows.length > 0) {
      // rejection_reason 컬럼이 있으면 함께 업데이트
      await pool.query(
        `UPDATE tasks SET status = 'rejected', rejection_reason = $1 WHERE id = $2`,
        [rejection_reason || null, task_id]
      );
    } else {
      // rejection_reason 컬럼이 없으면 status만 업데이트
      await pool.query(
        `UPDATE tasks SET status = 'rejected' WHERE id = $1`,
        [task_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reject task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error.stack },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

