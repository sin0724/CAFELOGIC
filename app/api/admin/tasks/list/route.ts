import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = `
      SELECT 
        t.*,
        r.username as reviewer_username,
        r.nickname as reviewer_nickname,
        c.name as cafe_name,
        t.business_name
      FROM tasks t
      LEFT JOIN reviewers r ON t.reviewer_id = r.id
      LEFT JOIN cafes c ON t.cafe_id = c.id
    `;

    const params: any[] = [];
    if (status) {
      query += ' WHERE t.status = $1';
      params.push(status);
    }

    query += ' ORDER BY t.assigned_at DESC';

    const result = await pool.query(query, params);

    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.error('List tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);

