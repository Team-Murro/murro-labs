'use client';

import { useState, useEffect } from 'react';

// 백엔드 데이터 타입 정의
interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function AdminNoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. 초기 데이터 로드 (작성된 글 목록 보여주기 위함)
  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      setNotices(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // 2. 글 작성 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('제목과 내용을 모두 입력해주세요.');

    setIsLoading(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        alert('등록되었습니다!');
        setTitle('');
        setContent('');
        fetchNotices(); // 목록 갱신
      } else {
        alert('등록 실패');
      }
    } catch (err) {
      alert('에러 발생');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 글 삭제 함수
  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('삭제되었습니다.');
        fetchNotices(); // 목록 갱신
      } else {
        alert('삭제 실패');
      }
    } catch (err) {
      alert('에러 발생');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-900">📢 공지사항 관리자 (Secret)</h1>

        {/* --- 글쓰기 폼 --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">새 공지 작성</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="제목을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="내용을 입력하세요 (줄바꿈 가능)"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isLoading ? '등록 중...' : '공지 등록하기'}
              </button>
            </div>
          </form>
        </div>

        {/* --- 작성된 글 목록 (삭제용) --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">등록된 공지 목록 ({notices.length})</h2>
          <div className="space-y-4">
            {notices.length === 0 ? (
              <p className="text-gray-500 text-center py-4">등록된 글이 없습니다.</p>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <h3 className="font-medium text-gray-900">{notice.title}</h3>
                    <p className="text-sm text-gray-500 truncate max-w-lg">{notice.content}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}