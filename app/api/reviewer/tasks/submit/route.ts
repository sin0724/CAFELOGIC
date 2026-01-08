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

    // 링크 정규화 (공백 제거, 중복 방지)
    const normalizedLink = submit_link.trim();
    
    if (!normalizedLink) {
      return NextResponse.json(
        { error: 'Submit link cannot be empty' },
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

    const task = taskResult.rows[0];
    
    // 이미 submit_link가 있는 경우 확인 (중복 방지)
    if (task.submit_link && task.submit_link.trim() !== '') {
      const existingLink = task.submit_link.trim();
      const newLink = submit_link.trim();
      
      if (existingLink === normalizedLink) {
        // 같은 링크면 그냥 성공 처리
        return NextResponse.json({ success: true, message: '이미 동일한 링크가 등록되어 있습니다.' });
      }
      
      // 다른 링크면 로그를 남기고 덮어쓰기 (프론트엔드에서 이미 확인함)
      console.log('Reviewer overwriting submit_link:', {
        task_id,
        reviewer_id: reviewerId,
        old_link: existingLink,
        new_link: normalizedLink
      });
    }

    // 작업 상태 업데이트 (rejection_reason은 선택적으로 NULL로 설정)
    const updateFields = ['status = $1', 'submit_link = $2'];
    const updateValues: any[] = ['submitted', normalizedLink];
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

