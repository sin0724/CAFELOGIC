'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Pagination from '@/components/Pagination';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [cafes, setCafes] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedReviewer, setSelectedReviewer] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);
  const [newReviewerId, setNewReviewerId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    cafe_link: '',
    business_name: '',
    place_address: '',
    need_photo: false,
    special_note: '',
    title_guide: '',
    content_guide: '',
    comment_guide: '',
    deadline: '',
  });
  const [cafeSelectionMode, setCafeSelectionMode] = useState<'list' | 'manual' | 'region'>('list');
  const [selectedRegionForArbitrary, setSelectedRegionForArbitrary] = useState<string>('');
  const [formData, setFormData] = useState({
    reviewer_id: '',
    cafe_id: '',
    task_type: '질문',
    deadline: '',
    cafe_link: '',
    business_name: '',
    place_address: '',
    need_photo: false,
    special_note: '',
    title_guide: '',
    content_guide: '',
    comment_guide: '',
  });

  useEffect(() => {
    fetchData();
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [statusFilter, selectedRegion, selectedReviewer]);

  // 검색어 변경 시에도 첫 페이지로
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const url = selectedRegion 
        ? `/api/admin/cafes/list?region=${encodeURIComponent(selectedRegion)}`
        : '/api/admin/cafes/list';
      
      const [tasksRes, reviewersRes, cafesRes] = await Promise.all([
        fetch(`/api/admin/tasks/list${statusFilter ? `?status=${statusFilter}` : ''}`),
        fetch('/api/admin/reviewers/list'),
        fetch(url),
      ]);

      const tasksData = await tasksRes.json();
      const reviewersData = await reviewersRes.json();
      const cafesData = await cafesRes.json();

      setTasks(tasksData.tasks || []);
      setReviewers(reviewersData.reviewers || []);
      setCafes(cafesData.cafes || []);
      if (cafesData.regions) {
        setRegions(cafesData.regions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 카페 선택 검증
    if (cafeSelectionMode === 'list' && !formData.cafe_id) {
      alert('카페를 선택하거나 다른 모드로 변경해주세요.');
      return;
    }
    if (cafeSelectionMode === 'manual' && !formData.cafe_link) {
      alert('카페 링크를 입력해주세요.');
      return;
    }
    if (cafeSelectionMode === 'region' && !selectedRegionForArbitrary) {
      alert('지역구를 선택해주세요.');
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        cafe_id: cafeSelectionMode === 'list' ? formData.cafe_id : null,
        is_region_arbitrary: cafeSelectionMode === 'region',
        region_arbitrary: cafeSelectionMode === 'region' ? selectedRegionForArbitrary : null,
      };
      
      const res = await fetch('/api/admin/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        setShowForm(false);
        setCafeSelectionMode('list');
        setFormData({
          reviewer_id: '',
          cafe_id: '',
          task_type: '질문',
          deadline: '',
          cafe_link: '',
          business_name: '',
          place_address: '',
          need_photo: false,
          special_note: '',
          title_guide: '',
          content_guide: '',
          comment_guide: '',
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create task');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleApprove = async (taskId: string) => {
    if (!confirm('이 작업을 승인하시겠습니까?')) return;

    try {
      const res = await fetch('/api/admin/tasks/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to approve task');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleReject = async (taskId: string) => {
    setRejectingTaskId(taskId);
    setRejectionReason('');
  };

  const confirmReject = async () => {
    if (!rejectingTaskId) return;

    try {
      const res = await fetch('/api/admin/tasks/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task_id: rejectingTaskId,
          rejection_reason: rejectionReason 
        }),
      });

      if (res.ok) {
        setRejectingTaskId(null);
        setRejectionReason('');
        fetchData();
      } else {
        const data = await res.json();
        const errorMessage = data.message || data.error || 'Failed to reject task';
        alert(`거부 실패: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Reject error:', error);
      alert(`거부 중 오류가 발생했습니다: ${error.message || 'Unknown error'}`);
    }
  };

  const handleReassign = async () => {
    if (!reassigningTaskId || !newReviewerId) {
      alert('리뷰어를 선택해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/admin/tasks/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: reassigningTaskId,
          reviewer_id: newReviewerId,
        }),
      });

      if (res.ok) {
        setReassigningTaskId(null);
        setNewReviewerId('');
        fetchData();
        alert('작업이 재분배되었습니다.');
      } else {
        const data = await res.json();
        alert(`재분배 실패: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Reassign error:', error);
      alert(`재분배 중 오류가 발생했습니다: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task.id);
    setEditFormData({
      cafe_link: task.cafe_link || '',
      business_name: task.business_name || '',
      place_address: task.place_address || '',
      need_photo: task.need_photo || false,
      special_note: task.special_note || '',
      title_guide: task.title_guide || '',
      content_guide: task.content_guide || '',
      comment_guide: task.comment_guide || '',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
    });
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId) return;

    try {
      const res = await fetch('/api/admin/tasks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: editingTaskId,
          ...editFormData,
        }),
      });

      if (res.ok) {
        setEditingTaskId(null);
        setEditFormData({
          cafe_link: '',
          business_name: '',
          place_address: '',
          need_photo: false,
          special_note: '',
          title_guide: '',
          content_guide: '',
          comment_guide: '',
          deadline: '',
        });
        fetchData();
        alert('작업이 수정되었습니다.');
      } else {
        const data = await res.json();
        alert(`수정 실패: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Update task error:', error);
      alert(`수정 중 오류가 발생했습니다: ${error.message || 'Unknown error'}`);
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
          <h1 className="text-2xl font-bold text-gray-900">작업 관리</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            {showForm ? '취소' : '+ 작업 생성'}
          </button>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태 필터
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">전체 상태</option>
                <option value="pending">대기 중</option>
                <option value="ongoing">진행 중</option>
                <option value="submitted">제출됨</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거부됨</option>
                <option value="declined">리뷰어 거절</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                리뷰어 필터
              </label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">전체 리뷰어</option>
                {reviewers.map((reviewer) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.nickname} ({reviewer.username})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                검색
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="카페명, 상호명, 리뷰어명 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setSelectedReviewer('');
                  setSearchQuery('');
                }}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">지역 필터:</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">전체 지역</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-sm text-gray-500">
              지역을 선택하면 해당 지역의 카페만 표시됩니다.
            </span>
          </div>
        )}

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">새 작업 생성</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    리뷰어 *
                  </label>
                  <select
                    value={formData.reviewer_id}
                    onChange={(e) => setFormData({ ...formData, reviewer_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">선택하세요</option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nickname} ({r.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카페 *
                  </label>
                  <div className="mb-2">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="cafeSelectionMode"
                          value="list"
                          checked={cafeSelectionMode === 'list'}
                          onChange={(e) => {
                            setCafeSelectionMode('list');
                            setFormData({ ...formData, cafe_id: '', cafe_link: '' });
                            setSelectedRegionForArbitrary('');
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">1. 리스트에서 선택</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="cafeSelectionMode"
                          value="manual"
                          checked={cafeSelectionMode === 'manual'}
                          onChange={(e) => {
                            setCafeSelectionMode('manual');
                            setFormData({ ...formData, cafe_id: '' });
                            setSelectedRegionForArbitrary('');
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">2. 직접 입력 (임의 작업)</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="cafeSelectionMode"
                          value="region"
                          checked={cafeSelectionMode === 'region'}
                          onChange={(e) => {
                            setCafeSelectionMode('region');
                            setFormData({ ...formData, cafe_id: '', cafe_link: '' });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">3. 해당 지역구 임의작업</span>
                      </label>
                    </div>
                  </div>
                  {cafeSelectionMode === 'list' ? (
                    <select
                      value={formData.cafe_id}
                      onChange={(e) => {
                        const selectedCafe = cafes.find(c => c.id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          cafe_id: e.target.value,
                          cafe_link: selectedCafe?.cafe_link || formData.cafe_link
                        });
                      }}
                      required={cafeSelectionMode === 'list'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">선택하세요</option>
                      {cafes.map((c) => {
                        let displayName = c.name;
                        if (!displayName && c.cafe_link) {
                          try {
                            const url = new URL(c.cafe_link);
                            displayName = url.pathname.split('/').filter(p => p).pop() || c.cafe_link;
                          } catch {
                            displayName = c.cafe_link;
                          }
                        }
                        if (!displayName) displayName = '이름 없음';
                        return (
                          <option key={c.id} value={c.id}>
                            {c.region ? `[${c.region}] ` : ''}{displayName}
                          </option>
                        );
                      })}
                    </select>
                  ) : cafeSelectionMode === 'manual' ? (
                    <input
                      type="text"
                      value={formData.cafe_link}
                      onChange={(e) => setFormData({ ...formData, cafe_link: e.target.value })}
                      placeholder="카페 링크를 입력하세요 (예: https://place.map.kakao.com/12345678)"
                      required={cafeSelectionMode === 'manual'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <select
                      value={selectedRegionForArbitrary}
                      onChange={(e) => setSelectedRegionForArbitrary(e.target.value)}
                      required={cafeSelectionMode === 'region'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">지역구를 선택하세요</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    작업 유형 *
                  </label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="질문">질문</option>
                    <option value="후기">후기</option>
                    <option value="댓글">댓글</option>
                    <option value="정보">정보</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    마감일
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카페 링크
                </label>
                <input
                  type="url"
                  value={formData.cafe_link}
                  onChange={(e) => setFormData({ ...formData, cafe_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자명
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formData.place_address}
                    onChange={(e) => setFormData({ ...formData, place_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.need_photo}
                    onChange={(e) => setFormData({ ...formData, need_photo: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">사진 필요</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  특이사항
                </label>
                <textarea
                  value={formData.special_note}
                  onChange={(e) => setFormData({ ...formData, special_note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 가이드
                  </label>
                  <textarea
                    value={formData.title_guide}
                    onChange={(e) => setFormData({ ...formData, title_guide: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용 가이드
                  </label>
                  <textarea
                    value={formData.content_guide}
                    onChange={(e) => setFormData({ ...formData, content_guide: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    댓글 가이드
                  </label>
                  <textarea
                    value={formData.comment_guide}
                    onChange={(e) => setFormData({ ...formData, comment_guide: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
              >
                생성
              </button>
            </form>
          </div>
        )}

        {/* 거부 사유 입력 모달 */}
        {rejectingTaskId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">작업 거부</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    거부 사유
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="거부 사유를 입력해주세요..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setRejectingTaskId(null);
                      setRejectionReason('');
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmReject}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    거부
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 재분배 모달 */}
        {reassigningTaskId && (() => {
          const currentTask = tasks.find(t => t.id === reassigningTaskId);
          const currentReviewer = currentTask 
            ? reviewers.find(r => r.id === currentTask.reviewer_id)
            : null;
          
          return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">리뷰어 변경</h3>
                  {currentReviewer && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">현재 리뷰어</p>
                      <p className="text-sm font-medium text-gray-900">
                        {currentReviewer.nickname} ({currentReviewer.username})
                      </p>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      새로운 리뷰어 선택
                    </label>
                    <select
                      value={newReviewerId}
                      onChange={(e) => setNewReviewerId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">리뷰어를 선택하세요</option>
                      {reviewers
                        .filter(reviewer => reviewer.id !== currentTask?.reviewer_id)
                        .map((reviewer) => (
                          <option key={reviewer.id} value={reviewer.id}>
                            {reviewer.nickname} ({reviewer.username})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setReassigningTaskId(null);
                        setNewReviewerId('');
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleReassign}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                    >
                      변경
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 작업 가이드 수정 모달 */}
        {editingTaskId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white mb-10">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">작업 가이드 수정</h3>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카페 링크
                    </label>
                    <input
                      type="url"
                      value={editFormData.cafe_link}
                      onChange={(e) => setEditFormData({ ...editFormData, cafe_link: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사업자명
                    </label>
                    <input
                      type="text"
                      value={editFormData.business_name}
                      onChange={(e) => setEditFormData({ ...editFormData, business_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      주소
                    </label>
                    <input
                      type="text"
                      value={editFormData.place_address}
                      onChange={(e) => setEditFormData({ ...editFormData, place_address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      마감일
                    </label>
                    <input
                      type="date"
                      value={editFormData.deadline}
                      onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.need_photo}
                        onChange={(e) => setEditFormData({ ...editFormData, need_photo: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">사진 필요</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      특이사항
                    </label>
                    <textarea
                      value={editFormData.special_note}
                      onChange={(e) => setEditFormData({ ...editFormData, special_note: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제목 가이드
                    </label>
                    <textarea
                      value={editFormData.title_guide}
                      onChange={(e) => setEditFormData({ ...editFormData, title_guide: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      내용 가이드
                    </label>
                    <textarea
                      value={editFormData.content_guide}
                      onChange={(e) => setEditFormData({ ...editFormData, content_guide: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      댓글 가이드
                    </label>
                    <textarea
                      value={editFormData.comment_guide}
                      onChange={(e) => setEditFormData({ ...editFormData, comment_guide: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={5}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={() => {
                      setEditingTaskId(null);
                      setEditFormData({
                        cafe_link: '',
                        business_name: '',
                        place_address: '',
                        need_photo: false,
                        special_note: '',
                        title_guide: '',
                        content_guide: '',
                        comment_guide: '',
                        deadline: '',
                      });
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdateTask}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    수정
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(() => {
          const filteredTasks = tasks.filter((task) => {
            // 상태 필터
            if (statusFilter && task.status !== statusFilter) return false;
            
            // 리뷰어 필터
            if (selectedReviewer && task.reviewer_id !== selectedReviewer) return false;
            
            // 검색 필터
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              const cafeName = (task.cafe_name || '').toLowerCase();
              const reviewerName = ((task.reviewer_nickname || task.reviewer_username) || '').toLowerCase();
              const businessName = (task.business_name || '').toLowerCase();
              if (!cafeName.includes(query) && !reviewerName.includes(query) && !businessName.includes(query)) {
                return false;
              }
            }
            
            return true;
          });

          return (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    총 <span className="font-medium text-gray-900">{filteredTasks.length}</span>개 작업
                    {(statusFilter || selectedReviewer || searchQuery) && (
                      <span className="ml-2 text-gray-500">
                        (전체 {tasks.length}개 중)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      리뷰어
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      카페
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      상호명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      마감일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        조건에 맞는 작업이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((task) => (
                        <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.reviewer_nickname || task.reviewer_username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.cafe_name || (task.is_region_arbitrary ? `[${task.region_arbitrary} 임의작업]` : '-')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {task.business_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.task_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'submitted'
                          ? 'bg-yellow-100 text-yellow-800'
                          :                         task.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : task.status === 'declined'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.status === 'pending' && '대기 중'}
                      {task.status === 'ongoing' && '진행 중'}
                      {task.status === 'submitted' && '제출됨'}
                      {task.status === 'approved' && '승인됨'}
                      {task.status === 'rejected' && '거부됨'}
                      {task.status === 'declined' && '리뷰어 거절'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2 flex-wrap">
                      {(task.status === 'pending' || task.status === 'ongoing') && (
                        <button
                          onClick={() => handleEditTask(task)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          가이드 수정
                        </button>
                      )}
                      {task.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => handleApprove(task.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(task.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            거부
                          </button>
                        </>
                      )}
                      {/* approved 상태를 제외한 모든 상태에서 리뷰어 변경 가능 */}
                      {task.status !== 'approved' && (
                        <button
                          onClick={() => {
                            setReassigningTaskId(task.id);
                            setNewReviewerId('');
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                        >
                          리뷰어 변경
                        </button>
                      )}
                      {task.submit_link && (
                        <a
                          href={task.submit_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm"
                        >
                          링크
                        </a>
                      )}
                    </div>
                  </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
              {filteredTasks.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredTasks.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}

