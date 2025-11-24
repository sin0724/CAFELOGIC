import { NextResponse } from 'next/server';
import { withReviewer } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const reviewerId = req.user?.userId;

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `SELECT 
        t.*,
        c.name as cafe_name,
        c.cafe_link,
        c.allow_review,
        c.allow_business_name,
        c.allow_after_post
      FROM tasks t
      LEFT JOIN cafes c ON t.cafe_id = c.id
      WHERE t.reviewer_id = $1
      ORDER BY 
        CASE t.status
          WHEN 'pending' THEN 1
          WHEN 'ongoing' THEN 2
          WHEN 'submitted' THEN 3
          WHEN 'approved' THEN 4
          WHEN 'rejected' THEN 5
          WHEN 'declined' THEN 6
        END,
        t.deadline ASC NULLS LAST`,
      [reviewerId]
    );

    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.error('List reviewer tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withReviewer(handler);

