import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { id, nickname, unit_price } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Reviewer ID is required' },
        { status: 400 }
      );
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (nickname !== undefined) {
      updateFields.push(`nickname = $${paramIndex}`);
      updateValues.push(nickname);
      paramIndex++;
    }

    if (unit_price !== undefined) {
      updateFields.push(`unit_price = $${paramIndex}`);
      updateValues.push(unit_price);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'At least one field (nickname or unit_price) must be provided' },
        { status: 400 }
      );
    }

    updateValues.push(id);

    const result = await pool.query(
      `UPDATE reviewers 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, nickname, unit_price, created_at`,
      updateValues
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, reviewer: result.rows[0] });
  } catch (error: any) {
    console.error('Update reviewer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);

