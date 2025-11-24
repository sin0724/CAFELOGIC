'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Pagination from '@/components/Pagination';
import { differenceInDays, parseISO } from 'date-fns';

export default function ReviewerTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [submitLink, setSubmitLink] = useState('');
  const [decliningTaskId, setDecliningTaskId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !submitLink) return;

    try {
      const res = await fetch('/api/reviewer/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedTask.id,
          submit_link: submitLink,
        }),
      });

      if (res.ok) {
        setSelectedTask(null);
        setSubmitLink('');
        fetchTasks();
      } else {
        const data = await res.json();
        const errorMessage = data.message || data.error || 'Failed to submit task';
        alert(`제출 실패: ${errorMessage}\n\n${data.userRole ? `현재 권한: ${data.userRole}` : ''}`);
        
        // 권한 문제인 경우 로그인 페이지로 리다이렉트
        if (res.status === 403 || res.status === 401) {
          window.location.href = '/auth/login';
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleShowGuide = async (task: any) => {
    setSelectedTask(task);
    setSubmitLink('');
    
    // pending 상태인 경우 ongoing으로 변경
    if (task.status === 'pending') {
      try {
        const res = await fetch('/api/reviewer/tasks/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: task.id }),
        });
        
        if (res.ok) {
          // 작업 목록 새로고침 후 선택된 작업도 업데이트
          const updatedTasks = await fetch('/api/reviewer/tasks/list').then(r => r.json());
          setTasks(updatedTasks.tasks || []);
          const updatedTask = updatedTasks.tasks?.find((t: any) => t.id === task.id);
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }
        }
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }
  };

  const handleDecline = async () => {
    if (!decliningTaskId) return;

    try {
      const res = await fetch('/api/reviewer/tasks/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: decliningTaskId,
          decline_reason: declineReason || '리뷰어가 작업을 거절했습니다.',
        }),
      });

      if (res.ok) {
        setDecliningTaskId(null);
        setDeclineReason('');
        fetchTasks();
        alert('작업이 거절되었습니다.');
      } else {
        const data = await res.json();
        alert(`거절 실패: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Decline error:', error);
      alert('거절 중 오류가 발생했습니다.');
    }
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const days = differenceInDays(parseISO(deadline), new Date());
    return days;
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
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">내 작업</h1>

        {selectedTask && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">작업 가이드 및 제출</h2>
            
            {/* 작업 정보 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>카페:</strong>{' '}
                {selectedTask.cafe_link ? (
                  <a
                    href={selectedTask.cafe_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 underline"
                  >
                    {selectedTask.cafe_name}
                  </a>
                ) : (
                  selectedTask.cafe_name
                )}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>작업 유형:</strong> {selectedTask.task_type}
              </p>
              {selectedTask.deadline && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>마감일:</strong> {new Date(selectedTask.deadline).toLocaleDateString('ko-KR')}
                </p>
              )}
              {selectedTask.business_name && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>상호명:</strong> {selectedTask.business_name}
                </p>
              )}
              {selectedTask.place_address && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>주소:</strong> {selectedTask.place_address}
                </p>
              )}
              {selectedTask.cafe_link && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>카페 링크:</strong>{' '}
                  <a
                    href={selectedTask.cafe_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 underline"
                  >
                    {selectedTask.cafe_link}
                  </a>
                </p>
              )}
              {selectedTask.need_photo && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-semibold text-orange-800">
                    📷 사진 필요
                  </p>
                </div>
              )}
            </div>

            {/* 거부 사유 표시 */}
            {selectedTask.status === 'rejected' && selectedTask.rejection_reason && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2">거부 사유</h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{selectedTask.rejection_reason}</p>
              </div>
            )}

            {/* 가이드 섹션 */}
            <div className="mb-6 space-y-4">
              {selectedTask.title_guide && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">제목 가이드</h3>
                  <p className="text-sm text-blue-700 whitespace-pre-wrap">{selectedTask.title_guide}</p>
                </div>
              )}

              {selectedTask.content_guide && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">내용 가이드</h3>
                  <p className="text-sm text-green-700 whitespace-pre-wrap">{selectedTask.content_guide}</p>
                </div>
              )}

              {selectedTask.comment_guide && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-800 mb-2">댓글 가이드</h3>
                  <p className="text-sm text-purple-700 whitespace-pre-wrap">{selectedTask.comment_guide}</p>
                </div>
              )}

              {selectedTask.special_note && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2">특이사항</h3>
                  <p className="text-sm text-yellow-700 whitespace-pre-wrap">{selectedTask.special_note}</p>
                </div>
              )}

              {!selectedTask.title_guide && !selectedTask.content_guide && !selectedTask.comment_guide && !selectedTask.special_note && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">가이드가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 제출 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제출 링크 *
                </label>
                <input
                  type="url"
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
                >
                  제출
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    setSubmitLink('');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
              {tasks
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((task) => {
                const days = getDaysUntilDeadline(task.deadline);
                return (
                  <>
                    <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {task.cafe_link ? (
                          <a
                            href={task.cafe_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary-600 hover:text-primary-800 underline"
                          >
                            {task.cafe_name}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {task.cafe_name}
                          </span>
                        )}
                        {!task.allow_review && task.task_type === '리뷰' && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            리뷰 불가
                          </span>
                        )}
                        {task.need_photo && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            📷 사진 필요
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.business_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.task_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.deadline ? (
                        <div>
                          {new Date(task.deadline).toLocaleDateString('ko-KR')}
                          {days !== null && days <= 3 && days >= 0 && (
                            <span className="ml-2 text-yellow-600 font-medium">(D-{days})</span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'submitted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : task.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : task.status === 'ongoing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status === 'pending' && '대기 중'}
                        {task.status === 'ongoing' && '진행 중'}
                        {task.status === 'submitted' && '제출됨'}
                        {task.status === 'approved' && '승인됨'}
                        {task.status === 'rejected' && '거부됨'}
                        {task.status === 'declined' && '거절됨'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2 flex-wrap">
                        {(task.status === 'pending' || task.status === 'ongoing' || task.status === 'rejected') && (
                          <button
                            onClick={() => handleShowGuide(task)}
                            className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm"
                          >
                            {task.status === 'rejected' ? '재제출' : '가이드 확인'}
                          </button>
                        )}
                        {(task.status === 'pending' || task.status === 'ongoing') && (
                          <button
                            onClick={() => setDecliningTaskId(task.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            작업 거절
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
                  {task.status === 'rejected' && task.rejection_reason && (
                    <tr key={`${task.id}-reason`}>
                      <td colSpan={6} className="px-6 py-3 bg-red-50">
                        <div className="text-sm">
                          <span className="font-semibold text-red-800">거부 사유: </span>
                          <span className="text-red-700">{task.rejection_reason}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
                );
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(tasks.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* 작업 거절 모달 */}
        {decliningTaskId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                작업 거절
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                작업을 거절하시겠습니까? 거절 사유를 입력해주세요.
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="거절 사유를 입력하세요 (선택사항)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setDecliningTaskId(null);
                    setDeclineReason('');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={handleDecline}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  거절
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

