import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler() {
  try {
    const result = await pool.query(
      `SELECT id, username, nickname, unit_price, created_at
       FROM reviewers
       ORDER BY created_at DESC`
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

