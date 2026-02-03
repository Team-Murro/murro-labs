'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MenuPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  const menus = ["한식", "중식", "일식", "양식", "분식", "패스트푸드", "카페/디저트", "편의점"];

  const spinRoulette = () => {
    setIsSpinning(true);
    setSelectedMenu(null);
    
    // 돌림판 효과를 위한 딜레이
    setTimeout(() => {
      const random = menus[Math.floor(Math.random() * menus.length)];
      setSelectedMenu(random);
      setIsSpinning(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0f172a] text-white p-6">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <Link href="/" className="text-slate-400 hover:text-white">← 돌아가기</Link>
        <h1 className="text-xl font-bold font-mono">MENU LAB</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-2xl flex flex-col items-center space-y-12">
        {/* 돌림판 시각화 (간단 버전) */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className={`w-full h-full border-8 border-slate-700 rounded-full flex items-center justify-center transition-all duration-[2000ms] ease-out ${isSpinning ? 'rotate-[1080deg]' : 'rotate-0'}`}>
            <div className="grid grid-cols-2 w-full h-full opacity-20">
              <div className="border border-slate-600"></div>
              <div className="border border-slate-600"></div>
              <div className="border border-slate-600"></div>
              <div className="border border-slate-600"></div>
            </div>
            <span className="absolute text-4xl">{isSpinning ? '🌀' : '🎡'}</span>
          </div>
          {/* 바늘 */}
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-2xl">👇</div>
        </div>

        <div className="w-full text-center">
          {selectedMenu ? (
            <div className="animate-bounce mb-6">
              <p className="text-slate-400 text-sm mb-2">오늘의 추천 메뉴는?</p>
              <h2 className="text-4xl font-black text-orange-400">{selectedMenu}!</h2>
            </div>
          ) : (
            <p className="text-slate-500 mb-8">고민 중인 메뉴가 있다면 맡겨보세요.</p>
          )}

          <button 
            onClick={spinRoulette}
            disabled={isSpinning}
            className="w-full max-w-xs py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-bold text-lg shadow-lg shadow-orange-900/20 transition-all disabled:opacity-50"
          >
            {isSpinning ? "운명의 메뉴 고르는 중..." : "돌림판 돌리기 🎡"}
          </button>
        </div>

        {/* 메뉴 리스트 태그 */}
        <div className="flex flex-wrap justify-center gap-2 opacity-40 text-[10px]">
          {menus.map(m => <span key={m} className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700">#{m}</span>)}
        </div>
      </main>
    </div>
  );
}