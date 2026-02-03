'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MenuPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const menus = ["한식", "중식", "일식", "양식", "분식", "패스트푸드", "고기", "카페"];

  const spin = () => {
    setIsSpinning(true);
    setResult(null);
    setTimeout(() => {
      const picked = menus[Math.floor(Math.random() * menus.length)];
      setResult(picked);
      setIsSpinning(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0f172a] text-white p-6">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <Link href="/" className="text-slate-400 hover:text-white font-bold">← 대시보드</Link>
        <h1 className="text-xl font-black text-orange-400">MENU PICKER</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-2xl flex flex-col items-center space-y-12 py-10">
        <div className={`text-8xl transition-transform duration-[1500ms] ease-out ${isSpinning ? 'rotate-[1080deg]' : 'rotate-0'}`}>
          {isSpinning ? '🌀' : (result ? '😋' : '🎡')}
        </div>

        <div className="text-center h-20">
          {result && (
            <div className="animate-bounce">
              <p className="text-slate-400 text-sm">오늘의 추천 카테고리</p>
              <h2 className="text-4xl font-black text-orange-400">{result}!</h2>
            </div>
          )}
        </div>

        <button onClick={spin} disabled={isSpinning} className="w-full max-w-xs py-5 bg-orange-600 hover:bg-orange-500 rounded-3xl font-black text-xl shadow-xl shadow-orange-900/40 disabled:opacity-50">
          {isSpinning ? "메뉴 고르는 중..." : "돌림판 돌리기 🚀"}
        </button>

        {result && (
          <Link href={`/map?category=${result}`} className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-300 underline underline-offset-4">
            주변의 {result} 맛집 지도 보기 →
          </Link>
        )}
      </main>
    </div>
  );
}