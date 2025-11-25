import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const {
      reviewer_id,
      cafe_id,
      task_type,
      deadline,
      cafe_link,
      business_name,
      place_address,
      need_photo,
      special_note,
      title_guide,
      content_guide,
      comment_guide,
      is_region_arbitrary,
      region_arbitrary,
    } = await req.json();

    if (!reviewer_id || !task_type) {
      return NextResponse.json(
        { error: 'Reviewer ID and task type are required' },
        { status: 400 }
      );
    }

    // cafe_id, cafe_link, 또는 region_arbitrary 중 하나는 필수
    if (!cafe_id && !cafe_link && !is_region_arbitrary) {
      return NextResponse.json(
        { error: 'Cafe ID, cafe link, or region arbitrary is required' },
        { status: 400 }
      );
    }

    // 지역구 임의작업인 경우 region_arbitrary 필수
    if (is_region_arbitrary && !region_arbitrary) {
      return NextResponse.json(
        { error: 'Region is required for region arbitrary task' },
        { status: 400 }
      );
    }

    let cafe = null;
    
    // cafe_id가 있는 경우 카페 제한사항 확인
    if (cafe_id) {
      const cafeResult = await pool.query('SELECT * FROM cafes WHERE id = $1', [cafe_id]);
      if (cafeResult.rows.length === 0) {
        return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
      }

      cafe = cafeResult.rows[0];

      // 제한사항 검증
      if (task_type === '후기' && !cafe.allow_after_post) {
        return NextResponse.json(
          { error: 'This cafe does not allow after posts' },
          { status: 400 }
        );
      }

      if (task_type === '리뷰' && !cafe.allow_review) {
        return NextResponse.json(
          { error: 'This cafe does not allow reviews' },
          { status: 400 }
        );
      }

      if (business_name && !cafe.allow_business_name) {
        return NextResponse.json(
          { error: 'This cafe does not allow business names' },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (
        reviewer_id, cafe_id, task_type, deadline, cafe_link,
        business_name, place_address, need_photo, special_note,
        title_guide, content_guide, comment_guide, status,
        is_region_arbitrary, region_arbitrary
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', $13, $14)
      RETURNING *`,
      [
        reviewer_id,
        cafe_id || null,
        task_type,
        deadline || null,
        cafe_link || null,
        business_name || null,
        place_address || null,
        need_photo || false,
        special_note || null,
        title_guide || null,
        content_guide || null,
        comment_guide || null,
        is_region_arbitrary || false,
        region_arbitrary || null,
      ]
    );

    return NextResponse.json({ success: true, task: result.rows[0] });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

