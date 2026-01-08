import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler() {
  try {
    const result = await pool.query(
      `SELECT 
        r.id, 
        r.username, 
        r.nickname, 
        r.unit_price, 
        r.created_at,
        COUNT(t.id) as task_count
      FROM reviewers r
      LEFT JOIN tasks t ON r.id = t.reviewer_id
      GROUP BY r.id, r.username, r.nickname, r.unit_price, r.created_at
      ORDER BY r.created_at DESC`
    );

    return NextResponse.json({ reviewers: result.rows });
  } catch (error) {
    console.error('List reviewers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);

