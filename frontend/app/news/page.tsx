'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NewsItem {
  summary: string;
  link: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/news/briefing')
      .then(res => res.json())
      .then(data => {
        if (data.items) setNews(data.items);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-white font-sans p-4">
      {/* 상단 헤더 */}
      <header className="w-full max-w-md flex justify-between py-6">
        <button onClick={() => router.back()} className="text-slate-400 font-bold hover:text-white transition-colors">← BACK</button>
        <h1 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            <span>⚡</span> 오늘의 뉴스
        </h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-md space-y-6">
        {/* 인트로 멘트 */}
        <div className="text-center space-y-2 mb-8">
            <p className="text-2xl font-bold">세상 돌아가는 소식</p>
            <p className="text-slate-400 text-sm">
                AI가 엄선한 주요 뉴스를 3줄로 요약해 드려요.<br/>
                관심 있는 뉴스는 클릭해서 원문을 확인하세요.
            </p>
        </div>

        {/* 뉴스 리스트 영역 */}
        <div className="space-y-4">
            {loading ? (
                // 로딩 스켈레톤
                [1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse border border-slate-700"></div>
                ))
            ) : (
                news.map((item, idx) => (
                    <a 
                        key={idx} 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block group relative bg-slate-800 hover:bg-indigo-900/40 border border-slate-700 hover:border-indigo-500/50 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 shadow-lg"
                    >
                        {/* 번호 장식 */}
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center font-bold text-sm border-4 border-slate-900 shadow-md group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            {idx + 1}
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <p className="text-slate-200 font-medium leading-relaxed group-hover:text-white break-keep">
                                {item.summary}
                            </p>
                            <span className="text-xl opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all">🔗</span>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                            <span className="text-[10px] text-slate-500 bg-slate-900/50 px-2 py-1 rounded group-hover:text-indigo-300">
                                원문 보기 →
                            </span>
                        </div>
                    </a>
                ))
            )}
        </div>

        {/* 하단 안내 */}
        <div className="text-center py-8">
            <p className="text-[10px] text-slate-600">
                Data provided by Google News RSS • Summarized by Ollama AI
            </p>
        </div>
      </main>
    </div>
  );
}