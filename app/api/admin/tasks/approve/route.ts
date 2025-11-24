import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { task_id } = await req.json();

    if (!task_id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // 작업 정보 가져오기
    const taskResult = await pool.query(
      `SELECT t.*, r.unit_price
       FROM tasks t
       JOIN reviewers r ON t.reviewer_id = r.id
       WHERE t.id = $1`,
      [task_id]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult.rows[0];
    
    // 작업 유형별 단가 설정
    // 댓글: 1000원, 그 외: 리뷰어 기본 단가
    let settlementAmount;
    if (task.task_type === '댓글') {
      settlementAmount = 1000;
    } else {
      settlementAmount = task.unit_price || 3000;
    }

    // 작업 승인
    await pool.query(
      `UPDATE tasks 
       SET status = 'approved', 
           approved_at = NOW(),
           settlement_amount = $1
       WHERE id = $2`,
      [settlementAmount, task_id]
    );

    // 월별 정산 업데이트
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    await pool.query(
      `INSERT INTO settlements (reviewer_id, month, task_count, total_amount)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (reviewer_id, month)
       DO UPDATE SET 
         task_count = settlements.task_count + 1,
         total_amount = settlements.total_amount + $3`,
      [task.reviewer_id, month, settlementAmount]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

