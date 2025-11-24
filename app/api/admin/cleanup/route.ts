import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';

async function handler() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 작업 삭제 (settlements는 자동으로 삭제됨 - 외래키 제약조건)
    await client.query('DELETE FROM tasks');
    
    // 리뷰어 삭제 (모든 리뷰어 삭제, 관리자 계정은 admins 테이블에 있으므로 영향 없음)
    await client.query('DELETE FROM reviewers');
    
    // 카페 삭제
    await client.query('DELETE FROM cafes');
    
    // 정산 내역 삭제
    await client.query('DELETE FROM settlements');

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully. Admin account preserved.',
      deleted: {
        tasks: 'all',
        reviewers: 'all',
        cafes: 'all',
        settlements: 'all'
      }
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to cleanup test data' 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export const POST = withAdmin(handler);

