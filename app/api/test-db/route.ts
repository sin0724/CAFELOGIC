import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Railway에서는 DATABASE_PUBLIC_URL을 우선 사용
    const dbUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DATABASE_URL or DATABASE_PUBLIC_URL is not configured',
          availableEnvVars: {
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            hasDatabasePublicUrl: !!process.env.DATABASE_PUBLIC_URL,
          }
        },
        { status: 500 }
      );
    }

    // 연결 문자열에서 호스트만 추출 (보안상 전체는 표시 안 함)
    const urlMatch = dbUrl.match(/@([^:]+):(\d+)\//);
    const hostInfo = urlMatch ? `${urlMatch[1]}:${urlMatch[2]}` : 'unknown';

    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      return NextResponse.json({ 
        success: true, 
        message: 'Database connection successful',
        time: result.rows[0].current_time,
        pgVersion: result.rows[0].pg_version,
        host: hostInfo
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Database connection error:', error);
    const errorDetails = {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorDetails,
        databaseUrlConfigured: !!process.env.DATABASE_URL
      },
      { status: 500 }
    );
  }
}

