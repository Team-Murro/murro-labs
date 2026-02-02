'use client';

import { useState, useEffect } from 'react';

export default function BalanceGamePage() {
  const [game, setGame] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 게임 불러오기
  const fetchNextGame = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/balance/next');
      const data = await res.json();
      if (data.error) {
        alert("게임 생성 중입니다. 잠시 후 다시 시도해주세요.");
      } else {
        setGame(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextGame();
  }, []);

  // 투표 하기
  const handleVote = async (choice: 'A' | 'B') => {
    if (result) return; // 중복 클릭 방지

    try {
      const res = await fetch(`/api/balance/${game.id}/vote?choice=${choice}`, { method: 'POST' });
      const data = await res.json();
      setResult(data);

      // 1.5초 뒤 다음 문제로 자동 이동 (무한 릴레이)
      setTimeout(() => {
        fetchNextGame();
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  if (!game) return <div className="flex h-screen items-center justify-center bg-black text-white">로딩중...</div>;

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col md:flex-row">
      
      {/* 질문 (가운데 상단) */}
      <div className="absolute top-10 w-full text-center z-20 pointer-events-none px-4">
        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
          {game.question}
        </h1>
      </div>

      {/* 왼쪽 (A) */}
      <div onClick={() => handleVote('A')} className="relative flex-1 h-1/2 md:h-full cursor-pointer group border-b-4 md:border-b-0 md:border-r-4 border-black">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
             style={{ backgroundImage: `url(${game.img_a || '/ready.png'})` }} />
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-all ${result ? 'bg-black/70' : ''}`}>
          <span className="text-5xl font-bold text-blue-400 drop-shadow-md mb-2">A</span>
          <span className="text-2xl font-bold text-white drop-shadow-md px-4 text-center">{game.option_a}</span>
          
          {/* 결과 표시 */}
          {result && (
            <div className="mt-4 animate-bounce">
              <span className="text-6xl font-black text-blue-400">{result.percent_a}%</span>
            </div>
          )}
        </div>
      </div>

      {/* VS 배지 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <div className="bg-red-600 text-white font-black text-2xl px-4 py-2 rounded-full border-4 border-white shadow-xl">
          VS
        </div>
      </div>

      {/* 오른쪽 (B) */}
      <div onClick={() => handleVote('B')} className="relative flex-1 h-1/2 md:h-full cursor-pointer group">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
             style={{ backgroundImage: `url(${game.img_b || '/ready.png'})` }} />
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-all ${result ? 'bg-black/70' : ''}`}>
          <span className="text-5xl font-bold text-red-400 drop-shadow-md mb-2">B</span>
          <span className="text-2xl font-bold text-white drop-shadow-md px-4 text-center">{game.option_b}</span>

          {/* 결과 표시 */}
          {result && (
            <div className="mt-4 animate-bounce">
              <span className="text-6xl font-black text-red-400">{result.percent_b}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}