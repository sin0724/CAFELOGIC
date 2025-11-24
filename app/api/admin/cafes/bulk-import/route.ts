import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

async function handler(req: any) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 파일을 버퍼로 읽기
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 엑셀 파일 파싱
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty or invalid' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 각 행 처리
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      try {
        // 엑셀 컬럼명 매핑 (다양한 형식 지원)
        const region = row['지역'] || row['region'] || row['Region'] || row['지역명'] || null;
        const cafe_link = row['카페링크'] || row['카페 링크'] || row['cafe_link'] || row['Cafe Link'] || row['링크'] || null;
        const allow_review = parseBoolean(row['리뷰허용'] || row['리뷰 허용'] || row['allow_review'] || row['Allow Review'] || 'true');
        const allow_business_name = parseBoolean(row['사업자명허용'] || row['사업자명 허용'] || row['allow_business_name'] || row['Allow Business Name'] || 'true');
        const allow_after_post = parseBoolean(row['후기허용'] || row['후기 허용'] || row['allow_after_post'] || row['Allow After Post'] || 'true');
        const require_approval = parseBoolean(row['승인필요'] || row['승인 필요'] || row['require_approval'] || row['Require Approval'] || 'true');
        const notes = row['메모'] || row['notes'] || row['Notes'] || row['비고'] || null;

        if (!cafe_link) {
          results.failed++;
          results.errors.push(`행 ${i + 2}: 카페 링크가 없습니다.`);
          continue;
        }

        // 카페 링크에서 자동으로 이름 추출
        let name = '';
        try {
          const url = new URL(cafe_link);
          const pathParts = url.pathname.split('/').filter(p => p);
          name = pathParts[pathParts.length - 1] || url.hostname;
        } catch {
          name = cafe_link;
        }

        // 카페 등록 (중복 체크 - 링크 기준)
        const existing = await pool.query(
          'SELECT id FROM cafes WHERE cafe_link = $1',
          [cafe_link]
        );

        if (existing.rows.length > 0) {
          results.failed++;
          results.errors.push(`행 ${i + 2}: "${cafe_link}" 이미 존재합니다.`);
          continue;
        }

        await pool.query(
          `INSERT INTO cafes (name, region, cafe_link, allow_review, allow_business_name, allow_after_post, require_approval, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            name,
            region || null,
            cafe_link || null,
            allow_review,
            allow_business_name,
            allow_after_post,
            require_approval,
            notes || null,
          ]
        );

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`행 ${i + 2}: ${error.message || '알 수 없는 오류'}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: data.length,
      imported: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // 최대 10개 오류만 반환
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import cafes' },
      { status: 500 }
    );
  }
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'y' || lower === '예' || lower === '허용') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'n' || lower === '아니오' || lower === '불가') {
      return false;
    }
  }
  return true; // 기본값
}

export const POST = withAdmin(handler);

