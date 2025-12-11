'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function ReviewerMyPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/reviewer/mypage/summary');
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">마이페이지</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">대기 중</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {summary?.stats?.pending_count || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">진행 중</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              {summary?.stats?.ongoing_count || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">제출됨</h3>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
              {summary?.stats?.submitted_count || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">승인됨</h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {summary?.stats?.approved_count || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">거부됨</h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {summary?.stats?.rejected_count || 0}
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">이번달 정산 예정금액</h2>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-primary-600">
              {summary?.monthlySettlement?.amount?.toLocaleString() || 0}원
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              ({summary?.monthlySettlement?.month || new Date().toISOString().slice(0, 7)} 기준)
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            승인된 날짜 기준으로 계산됩니다.
          </p>
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>유의사항:</strong> 매월 1일부터 말일까지의 작업건은 익월 10일에 정산됩니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">월별 정산 내역</h2>
            {summary?.settlements && summary.settlements.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {summary.settlements.map((settlement: any, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 p-2 sm:p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900">{settlement.month}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {settlement.task_count}개 작업
                      </p>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-primary-600">
                      {settlement.total_amount?.toLocaleString()}원
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">정산 내역이 없습니다.</p>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">최근 승인된 작업</h2>
            {summary?.recentTasks && summary.recentTasks.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {summary.recentTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-2 sm:p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{task.cafe_name}</p>
                        {task.business_name && (
                          <p className="text-xs sm:text-sm text-gray-600 truncate">상호명: {task.business_name}</p>
                        )}
                        <p className="text-xs sm:text-sm text-gray-500">{task.task_type}</p>
                        {task.approved_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(task.approved_at).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                      {task.settlement_amount && (
                        <p className="text-xs sm:text-sm font-medium text-green-600 whitespace-nowrap">
                          +{task.settlement_amount.toLocaleString()}원
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">승인된 작업이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

