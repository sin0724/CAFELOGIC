import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const {
      region,
      cafe_link,
      allow_review,
      allow_business_name,
      allow_after_post,
      require_approval,
      notes,
    } = await req.json();

    if (!cafe_link) {
      return NextResponse.json(
        { error: 'Cafe link is required' },
        { status: 400 }
      );
    }

    // 지역별 중복 체크 (같은 지역에 같은 cafe_link가 있으면 중복)
    const duplicateCheck = await pool.query(
      'SELECT id FROM cafes WHERE cafe_link = $1 AND region = $2',
      [cafe_link, region || null]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: `이미 등록된 카페입니다. (지역: ${region || '미지정'})` },
        { status: 400 }
      );
    }

    // 카페 링크에서 자동으로 이름 추출
    let name = '';
    try {
      const url = new URL(cafe_link);
      const pathParts = url.pathname.split('/').filter(p => p);
      name = pathParts[pathParts.length - 1] || url.hostname;
    } catch {
      // URL 파싱 실패 시 링크 자체를 이름으로 사용
      name = cafe_link;
    }

    const result = await pool.query(
      `INSERT INTO cafes (name, region, cafe_link, allow_review, allow_business_name, allow_after_post, require_approval, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        region || null,
        cafe_link || null,
        allow_review !== undefined ? allow_review : true,
        allow_business_name !== undefined ? allow_business_name : true,
        allow_after_post !== undefined ? allow_after_post : true,
        require_approval !== undefined ? require_approval : true,
        notes || null,
      ]
    );

    return NextResponse.json({ success: true, cafe: result.rows[0] });
  } catch (error) {
    console.error('Create cafe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

