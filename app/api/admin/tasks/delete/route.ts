import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { task_id } = await req.json();

    if (!task_id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [task_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);
