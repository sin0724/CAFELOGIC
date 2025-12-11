'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { differenceInDays, parseISO } from 'date-fns';

export default function ReviewerDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/reviewer/tasks/list');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const days = differenceInDays(parseISO(deadline), new Date());
    return days;
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'ongoing');
  const todayTasks = pendingTasks.filter((task) => {
    const days = getDaysUntilDeadline(task.deadline);
    return days !== null && days <= 3;
  });

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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">리뷰어 대시보드</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">대기 중인 작업</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {tasks.filter((t) => t.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">진행 중인 작업</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              {tasks.filter((t) => t.status === 'ongoing').length}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">거부된 작업</h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {tasks.filter((t) => t.status === 'rejected').length}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">승인된 작업</h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {tasks.filter((t) => t.status === 'approved').length}
            </p>
          </div>
        </div>

        {todayTasks.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ 마감 임박 작업 ({todayTasks.length}개)
            </h2>
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map((task) => {
                const days = getDaysUntilDeadline(task.deadline);
                return (
                  <div key={task.id} className="flex justify-between items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-700 truncate flex-1">
                      {task.cafe_name} - {task.task_type}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-yellow-800 whitespace-nowrap">
                      D-{days}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 대기 중인 작업 */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">대기 중인 작업</h2>
              <Link
                href="/reviewer/tasks"
                className="text-primary-600 hover:text-primary-800 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {tasks.filter((t) => t.status === 'pending').slice(0, 5).map((task) => {
                const days = getDaysUntilDeadline(task.deadline);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-medium text-gray-900 truncate">{task.cafe_name}</span>
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">({task.task_type})</span>
                      </div>
                      {task.business_name && (
                        <span className="text-xs sm:text-sm text-gray-600 block truncate">상호명: {task.business_name}</span>
                      )}
                      {task.deadline && (
                        <span className="text-xs sm:text-sm text-gray-500 block">
                          마감: {new Date(task.deadline).toLocaleDateString('ko-KR')}
                          {days !== null && days <= 3 && (
                            <span className="ml-2 text-yellow-600 font-medium">(D-{days})</span>
                          )}
                        </span>
                      )}
                    </div>
                    <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 whitespace-nowrap self-start sm:self-auto">
                      대기 중
                    </span>
                  </div>
                );
              })}
              {tasks.filter((t) => t.status === 'pending').length === 0 && (
                <p className="text-center text-gray-500 py-8">대기 중인 작업이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 진행 중인 작업 */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">진행 중인 작업</h2>
              <Link
                href="/reviewer/tasks"
                className="text-primary-600 hover:text-primary-800 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {tasks.filter((t) => t.status === 'ongoing').slice(0, 5).map((task) => {
                const days = getDaysUntilDeadline(task.deadline);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-medium text-gray-900 truncate">{task.cafe_name}</span>
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">({task.task_type})</span>
                      </div>
                      {task.business_name && (
                        <span className="text-xs sm:text-sm text-gray-600 block truncate">상호명: {task.business_name}</span>
                      )}
                      {task.deadline && (
                        <span className="text-xs sm:text-sm text-gray-500 block">
                          마감: {new Date(task.deadline).toLocaleDateString('ko-KR')}
                          {days !== null && days <= 3 && (
                            <span className="ml-2 text-yellow-600 font-medium">(D-{days})</span>
                          )}
                        </span>
                      )}
                    </div>
                    <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 whitespace-nowrap self-start sm:self-auto">
                      진행 중
                    </span>
                  </div>
                );
              })}
              {tasks.filter((t) => t.status === 'ongoing').length === 0 && (
                <p className="text-center text-gray-500 py-8">진행 중인 작업이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 거부된 작업 */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">거부된 작업</h2>
              <Link
                href="/reviewer/tasks"
                className="text-primary-600 hover:text-primary-800 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {tasks.filter((t) => t.status === 'rejected').slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-medium text-gray-900 truncate">{task.cafe_name}</span>
                      <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">({task.task_type})</span>
                    </div>
                    {task.business_name && (
                      <span className="text-xs sm:text-sm text-gray-600 block truncate">상호명: {task.business_name}</span>
                    )}
                    {task.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1 line-clamp-2">{task.rejection_reason}</p>
                    )}
                  </div>
                  <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 whitespace-nowrap self-start sm:self-auto">
                    거부됨
                  </span>
                </div>
              ))}
              {tasks.filter((t) => t.status === 'rejected').length === 0 && (
                <p className="text-center text-gray-500 py-8">거부된 작업이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 승인된 작업 */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">승인된 작업</h2>
              <Link
                href="/reviewer/tasks"
                className="text-primary-600 hover:text-primary-800 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {tasks.filter((t) => t.status === 'approved').slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-medium text-gray-900 truncate">{task.cafe_name}</span>
                      <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">({task.task_type})</span>
                    </div>
                    {task.business_name && (
                      <span className="text-xs sm:text-sm text-gray-600 block truncate">상호명: {task.business_name}</span>
                    )}
                    {task.settlement_amount && (
                      <span className="text-xs sm:text-sm text-green-600 font-medium block">
                        +{task.settlement_amount.toLocaleString()}원
                      </span>
                    )}
                  </div>
                  <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 whitespace-nowrap self-start sm:self-auto">
                    승인됨
                  </span>
                </div>
              ))}
              {tasks.filter((t) => t.status === 'approved').length === 0 && (
                <p className="text-center text-gray-500 py-8">승인된 작업이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

