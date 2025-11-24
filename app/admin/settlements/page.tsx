'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reviewersRes, tasksRes] = await Promise.all([
        fetch('/api/admin/reviewers/list'),
        fetch('/api/admin/tasks/list?status=approved'),
      ]);

      const reviewersData = await reviewersRes.json();
      const tasksData = await tasksRes.json();

      setReviewers(reviewersData.reviewers || []);
      
      // 월별 정산 데이터 계산
      const tasks = tasksData.tasks || [];
      const settlementMap: any = {};

      tasks.forEach((task: any) => {
        if (task.approved_at && task.settlement_amount) {
          const month = new Date(task.approved_at).toISOString().slice(0, 7);
          const key = `${task.reviewer_id}-${month}`;
          
          if (!settlementMap[key]) {
            settlementMap[key] = {
              reviewer_id: task.reviewer_id,
              reviewer_name: task.reviewer_nickname || task.reviewer_username,
              month,
              task_count: 0,
              total_amount: 0,
            };
          }
          
          settlementMap[key].task_count += 1;
          settlementMap[key].total_amount += task.settlement_amount || 0;
        }
      });

      const settlementsList = Object.values(settlementMap);
      setSettlements(settlementsList);
      
      // 월 목록 추출 및 정렬
      const uniqueMonths = Array.from(
        new Set(settlementsList.map((s: any) => s.month))
      ).sort().reverse();
      setMonths(uniqueMonths as string[]);
    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  // 월별로 그룹화
  const groupedByMonth = settlements.reduce((acc: any, settlement: any) => {
    if (!acc[settlement.month]) {
      acc[settlement.month] = {
        month: settlement.month,
        reviewers: [],
        total_amount: 0,
        total_task_count: 0,
      };
    }
    acc[settlement.month].reviewers.push(settlement);
    acc[settlement.month].total_amount += settlement.total_amount;
    acc[settlement.month].total_task_count += settlement.task_count;
    return acc;
  }, {});

  // 선택된 월 필터링
  const filteredMonths = selectedMonth
    ? [selectedMonth]
    : Object.keys(groupedByMonth).sort().reverse();

  if (loading) {
    return (
      <Layout role="admin">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">월 필터:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">전체</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {settlements.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500">정산 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMonths.map((month) => {
              const monthData = groupedByMonth[month];
              if (!monthData) return null;

              return (
                <div key={month} className="bg-white shadow rounded-lg overflow-hidden">
                  {/* 월별 헤더 */}
                  <div className="bg-primary-600 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-white">{month}</h2>
                        <p className="text-sm text-primary-100 mt-1">
                          총 {monthData.total_task_count}개 작업
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-primary-100">월별 총 정산액</p>
                        <p className="text-3xl font-bold text-white">
                          {monthData.total_amount.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 리뷰어별 정산 내역 */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            리뷰어
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            작업 수
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            정산액
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {monthData.reviewers
                          .sort((a: any, b: any) => b.total_amount - a.total_amount)
                          .map((settlement: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {settlement.reviewer_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {settlement.task_count}개
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {settlement.total_amount.toLocaleString()}원
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-gray-900">
                            합계
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                            {monthData.total_amount.toLocaleString()}원
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

