import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

async function handler(req: any) {
  try {
    const { username, nickname, unit_price } = await req.json();

    if (!username || !nickname || !unit_price) {
      return NextResponse.json(
        { error: 'Username, nickname, and unit_price are required' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword('1234');

    const result = await pool.query(
      `INSERT INTO reviewers (username, password_hash, nickname, unit_price)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, nickname, unit_price, created_at`,
      [username, passwordHash, nickname, unit_price]
    );

    return NextResponse.json({ success: true, reviewer: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }
    console.error('Create reviewer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

