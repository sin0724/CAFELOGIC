'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';

function SettlementsContent() {
  const searchParams = useSearchParams();
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  
  const [settlement, setSettlement] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlementDetail();
  }, [month]);

  const fetchSettlementDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviewer/settlements/${month}`);
      const data = await res.json();
      
      if (res.ok) {
        setSettlement(data.settlement);
        setTasks(data.tasks || []);
      } else {
        console.error('Error:', data.error);
        alert(data.error || '정산 내역을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching settlement detail:', error);
      alert('정산 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  if (loading) {
    return (
      <Layout role="reviewer">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="reviewer">
      <div className="px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {formatMonth(month)} 정산 내역
          </h1>
          <Link
            href="/reviewer/mypage"
            className="text-sm sm:text-base text-primary-600 hover:text-primary-800"
          >
            ← 마이페이지로
          </Link>
        </div>

        {/* 정산 요약 */}
        {settlement ? (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">총 작업 수</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {settlement.task_count || 0}개
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">총 정산 금액</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                  {settlement.total_amount?.toLocaleString() || 0}원
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">평균 단가</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {settlement.task_count > 0
                    ? Math.round((settlement.total_amount || 0) / settlement.task_count).toLocaleString()
                    : 0}원
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-yellow-800">
              {formatMonth(month)}의 정산 내역이 아직 생성되지 않았습니다.
            </p>
          </div>
        )}

        {/* 작업 목록 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              승인된 작업 목록 ({tasks.length}개)
            </h2>
          </div>

          {tasks.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
              <p className="text-sm sm:text-base">해당 월에 승인된 작업이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 뷰 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        승인일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        카페
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        상호명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        작업 유형
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        정산 금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        제출 링크
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.approved_at
                            ? new Date(task.approved_at).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.cafe_link ? (
                            <a
                              href={task.cafe_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary-600 hover:text-primary-800 underline"
                            >
                              {task.cafe_name || '카페 링크'}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {task.cafe_name || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.business_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.task_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {task.settlement_amount?.toLocaleString() || 0}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {task.submit_link ? (
                            <a
                              href={task.submit_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 underline"
                            >
                              링크
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 뷰 */}
              <div className="md:hidden divide-y divide-gray-200">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {task.cafe_link ? (
                            <a
                              href={task.cafe_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary-600 hover:text-primary-800 underline break-all"
                            >
                              {task.cafe_name || '카페 링크'}
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-gray-900 break-words">
                              {task.cafe_name || '-'}
                            </p>
                          )}
                          {task.business_name && (
                            <p className="text-xs text-gray-600 mt-1 break-words">
                              상호명: {task.business_name}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-green-600 whitespace-nowrap">
                          {task.settlement_amount?.toLocaleString() || 0}원
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">작업 유형:</span> {task.task_type}
                        </div>
                        <div>
                          <span className="font-medium">승인일:</span>{' '}
                          {task.approved_at
                            ? new Date(task.approved_at).toLocaleDateString('ko-KR')
                            : '-'}
                        </div>
                      </div>

                      {task.submit_link && (
                        <a
                          href={task.submit_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-primary-600 hover:text-primary-800 underline break-all"
                        >
                          제출 링크 보기
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function ReviewerSettlementsPage() {
  return (
    <Suspense fallback={
      <Layout role="reviewer">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </Layout>
    }>
      <SettlementsContent />
    </Suspense>
  );
}
