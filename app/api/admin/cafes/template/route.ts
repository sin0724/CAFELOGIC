import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import * as XLSX from 'xlsx';

async function handler() {
  try {
    // 엑셀 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 샘플 데이터
    const sampleData = [
      {
        '지역': '안양',
        '카페링크': 'https://cafe.naver.com/anyangtalk',
        '리뷰허용': 'true',
        '사업자명허용': 'true',
        '후기허용': 'true',
        '승인필요': 'true',
        '메모': '특이사항 없음',
      },
      {
        '지역': '안양',
        '카페링크': 'https://cafe.naver.com/happymom7979',
        '리뷰허용': 'true',
        '사업자명허용': 'true',
        '후기허용': 'true',
        '승인필요': 'true',
        '메모': '',
      },
      {
        '지역': '청주',
        '카페링크': 'https://cafe.naver.com/truecj',
        '리뷰허용': 'true',
        '사업자명허용': 'false',
        '후기허용': 'true',
        '승인필요': 'false',
        '메모': '',
      },
    ];

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 12 }, // 지역
      { wch: 40 }, // 카페링크
      { wch: 12 }, // 리뷰허용
      { wch: 15 }, // 사업자명허용
      { wch: 12 }, // 후기허용
      { wch: 12 }, // 승인필요
      { wch: 30 }, // 메모
    ];

    // 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, '카페 목록');

    // 엑셀 파일을 버퍼로 변환
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="cafe-import-template.xlsx"');

    return new NextResponse(excelBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);

