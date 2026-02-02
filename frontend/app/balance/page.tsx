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
      
      {/* 질문 (가운데 상단 고정, 글자 그림자 강화) */}
      <div className="absolute top-12 w-full text-center z-30 pointer-events-none px-6">
        <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] leading-tight break-keep">
          {game.question}
        </h1>
      </div>

      {/* 왼쪽 (A) */}
      <div 
        onClick={() => handleVote('A')} 
        className="relative flex-1 h-1/2 md:h-full cursor-pointer group border-b-4 md:border-b-0 md:border-r-4 border-black overflow-hidden"
      >
        {/* 배경 이미지 (확대 효과) */}
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
             style={{ backgroundImage: `url(${game.img_a || '/ready.png'})` }} />
        
        {/* 오버레이 & 텍스트 */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-all ${result ? 'bg-black/80' : 'group-hover:bg-black/20'}`}>
          {/* [수정] md:pr-16 : PC 화면에서 오른쪽(중앙)에 여백을 줘서 VS 배지와 안 겹치게 함 */}
          <div className="text-center px-4 md:pr-20 w-full z-10">
            <span className="block text-5xl font-bold text-blue-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2 transform group-hover:scale-110 transition-transform">A</span>
            <span className="block text-xl md:text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] break-keep leading-snug">
              {game.option_a}
            </span>
          </div>
          
          {/* 결과 표시 */}
          {result && (
            <div className="mt-6 animate-bounce z-20">
              <span className="text-6xl font-black text-blue-400 drop-shadow-lg">{result.percent_a}%</span>
            </div>
          )}
        </div>
      </div>

      {/* VS 배지 (위치 조정 및 z-index 최상위) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <div className="bg-red-600 text-white font-black text-3xl italic px-4 py-3 rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,0,0,0.5)] transform -rotate-12">
          VS
        </div>
      </div>

      {/* 오른쪽 (B) */}
      <div 
        onClick={() => handleVote('B')} 
        className="relative flex-1 h-1/2 md:h-full cursor-pointer group overflow-hidden"
      >
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
             style={{ backgroundImage: `url(${game.img_b || '/ready.png'})` }} />
             
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-all ${result ? 'bg-black/80' : 'group-hover:bg-black/20'}`}>
          {/* [수정] md:pl-16 : PC 화면에서 왼쪽(중앙)에 여백 추가 */}
          <div className="text-center px-4 md:pl-20 w-full z-10">
            <span className="block text-5xl font-bold text-red-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2 transform group-hover:scale-110 transition-transform">B</span>
            <span className="block text-xl md:text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] break-keep leading-snug">
              {game.option_b}
            </span>
          </div>

          {/* 결과 표시 */}
          {result && (
            <div className="mt-6 animate-bounce z-20">
              <span className="text-6xl font-black text-red-400 drop-shadow-lg">{result.percent_b}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );