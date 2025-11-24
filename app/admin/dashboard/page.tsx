'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [tasksRes, reviewersRes, cafesRes] = await Promise.all([
        fetch('/api/admin/tasks/list'),
        fetch('/api/admin/reviewers/list'),
        fetch('/api/admin/cafes/list'),
      ]);

      const tasksData = await tasksRes.json();
      const reviewersData = await reviewersRes.json();
      const cafesData = await cafesRes.json();

      const tasks = tasksData.tasks || [];
      const stats = {
        total: tasks.length,
        pending: tasks.filter((t: any) => t.status === 'pending').length,
        ongoing: tasks.filter((t: any) => t.status === 'ongoing').length,
        submitted: tasks.filter((t: any) => t.status === 'submitted').length,
        approved: tasks.filter((t: any) => t.status === 'approved').length,
        rejected: tasks.filter((t: any) => t.status === 'rejected').length,
        reviewers: reviewersData.reviewers?.length || 0,
        cafes: cafesData.cafes?.length || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('정말로 모든 테스트 데이터를 삭제하시겠습니까?\n\n삭제될 항목:\n- 모든 작업\n- 모든 리뷰어 (관리자 계정 제외)\n- 모든 카페\n- 모든 정산 내역\n\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setCleaning(true);
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert('테스트 데이터가 성공적으로 삭제되었습니다.');
        fetchStats(); // 통계 새로고침
      } else {
        alert(`삭제 실패: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
      console.error('Cleanup error:', error);
    } finally {
      setCleaning(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">관리자 대시보드</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="전체 작업"
            value={stats?.total || 0}
            color="blue"
            href="/admin/tasks"
          />
          <StatCard
            title="승인 대기"
            value={stats?.submitted || 0}
            color="yellow"
            href="/admin/tasks?status=submitted"
          />
          <StatCard
            title="리뷰어 수"
            value={stats?.reviewers || 0}
            color="green"
            href="/admin/reviewers"
          />
          <StatCard
            title="카페 수"
            value={stats?.cafes || 0}
            color="purple"
            href="/admin/cafes"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">작업 상태별 통계</h2>
            <div className="space-y-3">
              <StatusItem label="대기 중" count={stats?.pending || 0} color="gray" />
              <StatusItem label="진행 중" count={stats?.ongoing || 0} color="blue" />
              <StatusItem label="제출됨" count={stats?.submitted || 0} color="yellow" />
              <StatusItem label="승인됨" count={stats?.approved || 0} color="green" />
              <StatusItem label="거부됨" count={stats?.rejected || 0} color="red" />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h2>
            <div className="space-y-3">
              <Link
                href="/admin/reviewers"
                className="block w-full text-left px-4 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
              >
                리뷰어 계정 생성
              </Link>
              <Link
                href="/admin/cafes"
                className="block w-full text-left px-4 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
              >
                카페 추가
              </Link>
              <Link
                href="/admin/tasks"
                className="block w-full text-left px-4 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
              >
                작업 생성
              </Link>
              <button
                onClick={handleCleanup}
                disabled={cleaning}
                className="block w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cleaning ? '삭제 중...' : '🗑️ 테스트 데이터 삭제'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, color, href }: any) {
  const colorClasses: any = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <Link href={href}>
      <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition">
        <div className="flex items-center">
          <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl`}>
            {value}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatusItem({ label, count, color }: any) {
  const colorClasses: any = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-700">{label}</span>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses[color]}`}>
        {count}
      </span>
    </div>
  );
}

