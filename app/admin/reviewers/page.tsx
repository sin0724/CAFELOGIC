'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Pagination from '@/components/Pagination';

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    nickname: '',
    unit_price: 0,
  });
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    unit_price: 3000,
  });

  useEffect(() => {
    fetchReviewers();
  }, []);

  const fetchReviewers = async () => {
    try {
      const res = await fetch('/api/admin/reviewers/list');
      const data = await res.json();
      setReviewers(data.reviewers || []);
    } catch (error) {
      console.error('Error fetching reviewers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/reviewers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ username: '', nickname: '', unit_price: 3000 });
        fetchReviewers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create reviewer');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleEdit = (reviewer: any) => {
    setEditingId(reviewer.id);
    setEditFormData({
      nickname: reviewer.nickname || '',
      unit_price: reviewer.unit_price || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ nickname: '', unit_price: 0 });
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch('/api/admin/reviewers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          nickname: editFormData.nickname,
          unit_price: editFormData.unit_price,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditFormData({ nickname: '', unit_price: 0 });
        fetchReviewers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update reviewer');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`리뷰어 "${username}"을(를) 정말 삭제하시겠습니까?\n\n주의: 관련된 모든 작업(task)도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/reviewers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchReviewers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete reviewer');
      }
    } catch (error) {
      alert('An error occurred');
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">리뷰어 관리</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            {showForm ? '취소' : '+ 리뷰어 추가'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">새 리뷰어 계정 생성</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사용자 ID
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="reviewer001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  닉네임
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정산 단가 (원)
                </label>
                <input
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
              >
                생성 (기본 비밀번호: 1234)
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  사용자 ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  닉네임
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  정산 단가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  생성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviewers
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((reviewer) => (
                <tr key={reviewer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reviewer.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === reviewer.id ? (
                      <input
                        type="text"
                        value={editFormData.nickname}
                        onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      reviewer.nickname
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === reviewer.id ? (
                      <input
                        type="number"
                        value={editFormData.unit_price}
                        onChange={(e) => setEditFormData({ ...editFormData, unit_price: parseInt(e.target.value) || 0 })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      `${reviewer.unit_price?.toLocaleString()}원`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reviewer.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === reviewer.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(reviewer.id)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800 font-medium"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(reviewer)}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(reviewer.id, reviewer.username)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(reviewers.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </Layout>
  );
}

