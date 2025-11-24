import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler(req: any) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region');

    let query = 'SELECT * FROM cafes';
    const params: any[] = [];

    if (region) {
      query += ' WHERE region = $1';
      params.push(region);
    }

    query += ' ORDER BY region ASC, name ASC';

    const result = await pool.query(query, params);

    // 지역 목록도 함께 반환
    const regionsResult = await pool.query(
      'SELECT DISTINCT region FROM cafes WHERE region IS NOT NULL ORDER BY region ASC'
    );

    return NextResponse.json({ 
      cafes: result.rows,
      regions: regionsResult.rows.map((r: any) => r.region)
    });
  } catch (error) {
    console.error('List cafes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);

