import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const {
      task_id,
      cafe_link,
      business_name,
      place_address,
      need_photo,
      special_note,
      title_guide,
      content_guide,
      comment_guide,
      deadline,
    } = await req.json();

    if (!task_id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // 작업이 존재하고 pending 또는 ongoing 상태인지 확인
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

    const taskStatus = taskCheck.rows[0].status;
    if (taskStatus !== 'pending' && taskStatus !== 'ongoing') {
      return NextResponse.json(
        { error: 'Only pending or ongoing tasks can be updated' },
        { status: 400 }
      );
    }

    // 작업 정보 업데이트
    // deadline은 빈 문자열이면 null로 설정하고, 값이 있으면 그 값을 사용
    const deadlineValue = deadline === '' ? null : deadline;
    
    const result = await pool.query(
      `UPDATE tasks 
       SET cafe_link = COALESCE($1, cafe_link),
           business_name = COALESCE($2, business_name),
           place_address = COALESCE($3, place_address),
           need_photo = COALESCE($4, need_photo),
           special_note = COALESCE($5, special_note),
           title_guide = COALESCE($6, title_guide),
           content_guide = COALESCE($7, content_guide),
           comment_guide = COALESCE($8, comment_guide),
           deadline = $9
       WHERE id = $10
       RETURNING *`,
      [
        cafe_link || null,
        business_name || null,
        place_address || null,
        need_photo !== undefined ? need_photo : null,
        special_note || null,
        title_guide || null,
        content_guide || null,
        comment_guide || null,
        deadlineValue,
        task_id,
      ]
    );

    return NextResponse.json({ success: true, task: result.rows[0] });
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

