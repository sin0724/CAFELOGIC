import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const {
      task_id,
      task_type,
      submit_link,
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
      'SELECT id, status, submit_link FROM tasks WHERE id = $1',
      [task_id]
    );

    if (taskCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = taskCheck.rows[0];
    const taskStatus = task.status;
    if (taskStatus !== 'pending' && taskStatus !== 'ongoing') {
      return NextResponse.json(
        { error: 'Only pending or ongoing tasks can be updated' },
        { status: 400 }
      );
    }

    // submit_link 업데이트 시 기존 링크 확인 및 정규화 (중복 방지)
    let submitLinkValue: string | null | undefined = undefined;
    if (submit_link !== undefined) {
      if (submit_link === null || submit_link === '') {
        submitLinkValue = null;
      } else {
        const trimmedSubmitLink = submit_link.trim();
        if (!trimmedSubmitLink) {
          submitLinkValue = null;
        } else {
          submitLinkValue = trimmedSubmitLink;
          
          if (task.submit_link && task.submit_link.trim() !== '' && task.submit_link.trim() !== trimmedSubmitLink) {
            // 기존 링크가 있고 다른 링크로 업데이트하려는 경우
            // 관리자는 덮어쓰기 가능하지만 로그를 남김
            console.log('Admin updating submit_link:', {
              task_id,
              old_link: task.submit_link,
              new_link: trimmedSubmitLink
            });
          }
        }
      }
    }

    // 작업 정보 업데이트
    // deadline은 undefined이거나 빈 문자열이면 null로 설정하고, 값이 있으면 그 값을 사용
    // 날짜 형식이 올바른지 확인 (YYYY-MM-DD 형식)
    let deadlineValue: string | null = null;
    if (deadline !== undefined && deadline !== null && deadline !== '') {
      // 날짜 형식 검증 (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(deadline)) {
        deadlineValue = deadline;
      } else {
        // 형식이 맞지 않으면 에러 반환
        return NextResponse.json(
          { error: 'Invalid deadline format. Expected YYYY-MM-DD' },
          { status: 400 }
        );
      }
    }
    
    console.log('Updating task:', { task_id, deadline, deadlineValue, submit_link: submitLinkValue });
    
    // 동적으로 업데이트 필드 구성
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    updateFields.push(`task_type = COALESCE($${paramIndex}, task_type)`);
    updateValues.push(task_type || null);
    paramIndex++;
    
    if (submit_link !== undefined) {
      updateFields.push(`submit_link = $${paramIndex}`);
      updateValues.push(submitLinkValue);
      paramIndex++;
    }
    
    updateFields.push(`cafe_link = COALESCE($${paramIndex}, cafe_link)`);
    updateValues.push(cafe_link || null);
    paramIndex++;
    
    updateFields.push(`business_name = COALESCE($${paramIndex}, business_name)`);
    updateValues.push(business_name || null);
    paramIndex++;
    
    updateFields.push(`place_address = COALESCE($${paramIndex}, place_address)`);
    updateValues.push(place_address || null);
    paramIndex++;
    
    updateFields.push(`need_photo = COALESCE($${paramIndex}, need_photo)`);
    updateValues.push(need_photo !== undefined ? need_photo : null);
    paramIndex++;
    
    updateFields.push(`special_note = COALESCE($${paramIndex}, special_note)`);
    updateValues.push(special_note || null);
    paramIndex++;
    
    updateFields.push(`title_guide = COALESCE($${paramIndex}, title_guide)`);
    updateValues.push(title_guide || null);
    paramIndex++;
    
    updateFields.push(`content_guide = COALESCE($${paramIndex}, content_guide)`);
    updateValues.push(content_guide || null);
    paramIndex++;
    
    updateFields.push(`comment_guide = COALESCE($${paramIndex}, comment_guide)`);
    updateValues.push(comment_guide || null);
    paramIndex++;
    
    updateFields.push(`deadline = $${paramIndex}`);
    updateValues.push(deadlineValue);
    paramIndex++;
    
    updateValues.push(task_id);
    
    const result = await pool.query(
      `UPDATE tasks 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      updateValues
    );

    console.log('Task updated successfully:', { task_id, updated_deadline: result.rows[0]?.deadline });
    
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

