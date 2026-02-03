'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BalanceGamePage() {
  const [game, setGame] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<string[]>([]);

  // 데이터 로드 로직 (기존과 동일)
  const fetchNextGame = async () => {
    setResult(null);
    try {
      const res = await fetch('/api/balance/next');
      const data = await res.json();
      
      if (history.includes(data.question)) {
        fetchNextGame(); 
        return;
      }
      setGame(data);
      setHistory(prev => [data.question, ...prev].slice(0, 10));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNextGame();
  }, []);

  const handleVote = async (choice: 'A' | 'B') => {
    if (result || !game) return;
    try {
      const res = await fetch(`/api/balance/${game.id}/vote?choice=${choice}`, { method: 'POST' });
      setResult(await res.json());
      setTimeout(fetchNextGame, 1500);
    } catch (e) { console.error(e); }
  };

  if (!game) return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white font-mono animate-pulse">
      LOADING NEW QUESTION...
    </div>
  );

  return (
    // [구조 변경] 전체를 Flex-col로 잡아서 헤더와 게임영역을 분리
    <div className="flex flex-col h-screen w-full bg-black">
      
      {/* 1. 상단 헤더 (게임 영역 밖으로 분리됨) */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 justify-between shrink-0 z-50">
        <Link href="/" className="flex items-center text-slate-400 hover:text-white transition-colors">
          <span className="text-xl mr-1">‹</span>
          <span className="text-xs font-bold tracking-widest">DASHBOARD</span>
        </Link>
        <span className="text-gray-600 text-[10px] font-mono tracking-tighter">MURRO LABS BALANCE</span>
      </header>

      {/* 2. 게임 메인 영역 (남은 공간 꽉 채우기 flex-1) */}
      <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        
        {/* 질문 텍스트 (게임 영역 내 상단에 위치하되, 헤더와 겹치지 않음) */}
        <div className="absolute top-6 w-full text-center z-30 pointer-events-none px-4">
          <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-tight break-keep max-w-5xl mx-auto">
            {game.question}
          </h1>
        </div>

        {/* 왼쪽 (A) */}
        <div onClick={() => handleVote('A')} className="relative flex-1 cursor-pointer group border-b-2 md:border-b-0 md:border-r-2 border-black overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
               style={{ backgroundImage: `url(${game.img_a || '/ready.png'})` }} />
          <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-all ${result ? 'bg-black/80' : 'group-hover:bg-black/20'}`}>
            <span className="text-5xl font-bold text-blue-500 drop-shadow-md mb-2">A</span>
            <span className="text-xl md:text-2xl font-bold text-white drop-shadow-md px-4 text-center break-keep">{game.option_a}</span>
            {result && <div className="mt-4 text-5xl font-black text-blue-400 animate-bounce">{result.percent_a}%</div>}
          </div>
        </div>

        {/* VS 배지 (중앙 정렬) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
          <div className="bg-red-600 text-white font-black text-2xl italic px-3 py-2 rounded-full border-4 border-white shadow-lg transform -rotate-12">VS</div>
        </div>

        {/* 오른쪽 (B) */}
        <div onClick={() => handleVote('B')} className="relative flex-1 cursor-pointer group overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
               style={{ backgroundImage: `url(${game.img_b || '/ready.png'})` }} />
          <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-all ${result ? 'bg-black/80' : 'group-hover:bg-black/20'}`}>
            <span className="text-5xl font-bold text-red-500 drop-shadow-md mb-2">B</span>
            <span className="text-xl md:text-2xl font-bold text-white drop-shadow-md px-4 text-center break-keep">{game.option_b}</span>
            {result && <div className="mt-4 text-5xl font-black text-red-400 animate-bounce">{result.percent_b}%</div>}
          </div>
        </div>

      </main>
    </div>
  );
}