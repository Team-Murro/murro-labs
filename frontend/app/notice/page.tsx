'use client';

import { useState, useEffect } from 'react';

// 백엔드에서 받아올 데이터 형태 정의 (Schema와 일치)
interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function NoticePage() {
  // 1. 상태 관리 (데이터, 로딩 여부, 아코디언 열림 여부)
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  // 2. 백엔드 API 호출 (컴포넌트가 처음 뜰 때 실행)
  useEffect(() => {
    async function fetchNotices() {
      try {
        const res = await fetch('/api/notices'); // 백엔드 호출
        if (!res.ok) throw new Error('데이터 가져오기 실패');
        const data = await res.json();
        setNotices(data);
      } catch (error) {
        console.error("공지사항 로딩 에러:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotices();
  }, []);

  // 3. 아코디언 토글 함수
  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  // 4. 날짜 포맷팅 함수 (2026-02-02T10:00:00 -> 2026.02.02)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 영역 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">공지사항</h1>
          <p className="text-gray-600">MURRO LABS의 새로운 소식을 알려드립니다.</p>
        </div>

        {/* 공지사항 목록 영역 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {isLoading ? (
            // 로딩 중일 때 표시
            <div className="p-8 text-center text-gray-500">
              데이터를 불러오는 중입니다...
            </div>
          ) : notices.length === 0 ? (
            // 데이터가 없을 때 표시
            <div className="p-8 text-center text-gray-500">
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            // 데이터가 있을 때 목록 표시
            notices.map((notice) => (
              <div key={notice.id} className="border-b border-gray-100 last:border-0">
                {/* 제목 줄 (클릭 시 펼쳐짐) */}
                <button
                  onClick={() => toggleAccordion(notice.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                      <h3 className="font-medium text-gray-900">{notice.title}</h3>
                    </div>
                    <span className="text-sm text-gray-400 pl-5">
                      {formatDate(notice.created_at)}
                    </span>
                  </div>
                  
                  {/* 화살표 아이콘 */}
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                      openId === notice.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 내용 영역 (펼쳐졌을 때만 보임) */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openId === notice.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6 pl-11">
                    <div className="pt-4 border-t border-gray-100 text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {notice.content}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}