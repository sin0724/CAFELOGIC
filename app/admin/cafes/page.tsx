'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Pagination from '@/components/Pagination';

export default function CafesPage() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    region: '',
    cafe_link: '',
    allow_review: true,
    allow_business_name: true,
    allow_after_post: true,
    require_approval: true,
    notes: '',
  });

  useEffect(() => {
    fetchCafes();
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [selectedRegion]);

  const fetchCafes = async () => {
    try {
      const url = selectedRegion 
        ? `/api/admin/cafes/list?region=${encodeURIComponent(selectedRegion)}`
        : '/api/admin/cafes/list';
      const res = await fetch(url);
      const data = await res.json();
      setCafes(data.cafes || []);
      if (data.regions) {
        setRegions(data.regions);
      }
    } catch (error) {
      console.error('Error fetching cafes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cafes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          region: '',
          cafe_link: '',
          allow_review: true,
          allow_business_name: true,
          allow_after_post: true,
          require_approval: true,
          notes: '',
        });
        fetchCafes();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create cafe');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 확장자 확인
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/cafes/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadResult({
          success: true,
          total: data.total,
          imported: data.imported,
          failed: data.failed,
          errors: data.errors || [],
        });
        fetchCafes();
      } else {
        setUploadResult({
          success: false,
          error: data.error || '업로드 실패',
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: '파일 업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setUploading(false);
      // 파일 input 초기화
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/admin/cafes/template');
      
      if (!res.ok) {
        alert('템플릿 다운로드에 실패했습니다.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cafe-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('템플릿 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadTxt = async () => {
    try {
      const url = selectedRegion 
        ? `/api/admin/cafes/export-txt?region=${encodeURIComponent(selectedRegion)}`
        : '/api/admin/cafes/export-txt';
      
      const res = await fetch(url);
      
      if (!res.ok) {
        alert('리스트 다운로드에 실패했습니다.');
        return;
      }

      const blob = await res.blob();
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      const filename = selectedRegion 
        ? `cafe-list-${selectedRegion}-${new Date().toISOString().split('T')[0]}.txt`
        : `cafe-list-all-${new Date().toISOString().split('T')[0]}.txt`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlObj);
      document.body.removeChild(a);
    } catch (error) {
      alert('리스트 다운로드 중 오류가 발생했습니다.');
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
          <h1 className="text-2xl font-bold text-gray-900">카페 관리</h1>
          <div className="flex gap-3">
            <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer text-center whitespace-nowrap">
              {uploading ? '업로드 중...' : '📊 엑셀 대량 등록'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              onClick={handleDownloadTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            >
              📥 엑셀 양식 다운로드
            </button>
            <button
              onClick={handleDownloadTxt}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            >
              📄 TXT 리스트 다운로드
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            >
              {showForm ? '취소' : '+ 카페 추가'}
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">지역 필터:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">전체</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 엑셀 파일 형식 안내</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>필수 컬럼:</strong> 카페링크 (또는 카페 링크, cafe_link, 링크)</p>
            <p><strong>선택 컬럼:</strong> 지역, 리뷰허용, 사업자명허용, 후기허용, 승인필요, 메모</p>
            <p className="text-xs text-gray-600 mt-1">※ 카페명은 링크에서 자동으로 추출됩니다.</p>
            <p><strong>허용/불가 값:</strong> true/1/yes/예/허용 또는 false/0/no/아니오/불가</p>
            <p className="text-xs text-blue-600 mt-2">※ 첫 번째 행은 헤더로 인식됩니다.</p>
          </div>
        </div>

        {uploadResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            uploadResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {uploadResult.success ? (
              <div>
                <h3 className="font-semibold text-green-800 mb-2">
                  ✅ 업로드 완료
                </h3>
                <p className="text-sm text-green-700">
                  전체: {uploadResult.total}개 | 
                  성공: {uploadResult.imported}개 | 
                  실패: {uploadResult.failed}개
                </p>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-green-800">오류 내역:</p>
                    <ul className="text-xs text-green-700 list-disc list-inside mt-1">
                      {uploadResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-red-800 mb-2">
                  ❌ 업로드 실패
                </h3>
                <p className="text-sm text-red-700">
                  {uploadResult.error}
                </p>
              </div>
            )}
            <button
              onClick={() => setUploadResult(null)}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              닫기
            </button>
          </div>
        )}

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">새 카페 추가</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카페 링크 *
                </label>
                <input
                  type="url"
                  value={formData.cafe_link}
                  onChange={(e) => setFormData({ ...formData, cafe_link: e.target.value })}
                  placeholder="https://cafe.naver.com/..."
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  카페명은 링크에서 자동으로 추출됩니다.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지역
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="예: 안양, 청주"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allow_review}
                    onChange={(e) => setFormData({ ...formData, allow_review: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">리뷰 허용</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allow_business_name}
                    onChange={(e) => setFormData({ ...formData, allow_business_name: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">사업자명 허용</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allow_after_post}
                    onChange={(e) => setFormData({ ...formData, allow_after_post: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">후기 허용</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.require_approval}
                    onChange={(e) => setFormData({ ...formData, require_approval: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">승인 필요</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
              >
                추가
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  지역
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  제한사항
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  메모
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cafes
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((cafe) => (
                <tr key={cafe.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cafe.region || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>
                        {cafe.name || (() => {
                          try {
                            if (cafe.cafe_link) {
                              const url = new URL(cafe.cafe_link);
                              return url.pathname.split('/').filter(p => p).pop() || cafe.cafe_link;
                            }
                            return '이름 없음';
                          } catch {
                            return cafe.cafe_link || '이름 없음';
                          }
                        })()}
                      </span>
                      {cafe.cafe_link && (
                        <a
                          href={cafe.cafe_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                          title={cafe.cafe_link}
                        >
                          🔗
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {!cafe.allow_review && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">리뷰 불가</span>
                      )}
                      {!cafe.allow_business_name && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">사업자명 불가</span>
                      )}
                      {!cafe.allow_after_post && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">후기 불가</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cafe.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(cafes.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </Layout>
  );
}

