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

    // TXT 파일 생성 (간단한 형식)
    let txtContent = '';

    // 지역별로 그룹화
    const cafesByRegion: { [key: string]: any[] } = {};
    result.rows.forEach((cafe: any) => {
      const regionKey = cafe.region || '미지정';
      if (!cafesByRegion[regionKey]) {
        cafesByRegion[regionKey] = [];
      }
      cafesByRegion[regionKey].push(cafe);
    });

    // 지역별로 출력 (간단한 형식)
    Object.keys(cafesByRegion).sort().forEach((regionKey) => {
      txtContent += `[${regionKey}]\n`;
      cafesByRegion[regionKey].forEach((cafe) => {
        if (cafe.cafe_link) {
          txtContent += `${cafe.cafe_link}\n`;
        }
      });
      txtContent += '\n';
    });

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'text/plain; charset=utf-8');
    const filename = region 
      ? `cafe-list-${region}-${new Date().toISOString().split('T')[0]}.txt`
      : `cafe-list-all-${new Date().toISOString().split('T')[0]}.txt`;
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    return new NextResponse(txtContent, { headers });
  } catch (error) {
    console.error('Export TXT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);

