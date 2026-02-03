'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [menuData, setMenuData] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalMenu, setFinalMenu] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const fetchMenus = () => {
    if (!navigator.geolocation) return alert("위치 정보가 필요합니다.");
    setLoading(true);
    setMenuData(null);
    setFinalMenu(null);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch('/api/menu/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        });
        const data = await res.json();
        setMenuData(data);
      } catch (e) { alert("추천 실패"); }
      finally { setLoading(false); }
    }, () => { alert("위치 권한을 허용해주세요."); setLoading(false); });
  };

  const spinWheel = () => {
    if (!menuData || isSpinning) return;
    setIsSpinning(true);
    setFinalMenu(null);
    const randomDeg = Math.floor(Math.random() * 360);
    const totalDeg = 360 * 8 + randomDeg; // 8바퀴 회전 후 멈춤
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)';
      wheelRef.current.style.transform = `rotate(${totalDeg}deg)`;
    }
    setTimeout(() => {
      setIsSpinning(false);
      const pieceIndex = Math.floor((360 - (randomDeg % 360)) / 60) % 6;
      setFinalMenu(menuData.menus[pieceIndex]);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <header className="w-full max-w-md flex justify-between py-6">
        <Link href="/" className="text-slate-400 font-bold">← BACK</Link>
        <h1 className="text-xl font-bold font-mono text-orange-500">MENU PICK</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-md flex flex-col items-center space-y-10 py-6">
        {!menuData ? (
          <div className="text-center space-y-6 py-10">
            <div className="text-7xl grayscale opacity-30">🍽️</div>
            <h2 className="text-xl font-bold">오늘의 최적 메뉴는?</h2>
            {/* '6가지' 단어 제거 완료 */}
            <p className="text-slate-400 text-sm leading-relaxed">위치, 날씨, 시간 데이터를 분석하여<br/>최적의 메뉴를 제안합니다.</p>
            <button onClick={fetchMenus} disabled={loading} className="px-10 py-4 bg-orange-600 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all">
               {loading ? "데이터 분석 중..." : "추천 시작하기"}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-slate-800 p-4 rounded-2xl text-center border border-orange-500/20 w-full shadow-lg">
               <p className="text-orange-400 font-bold mb-1 text-[10px] uppercase tracking-widest">AI Reasoning</p>
               <p className="text-slate-200 text-sm leading-relaxed italic">"{menuData.reason}"</p>
            </div>

            <div className="relative w-72 h-72">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30 text-red-500 text-4xl drop-shadow-md">▼</div>
              
              {/* 돌림판 디자인 수정: 구분선 추가 */}
              <div ref={wheelRef} className="w-full h-full rounded-full border-[6px] border-slate-700 overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-slate-800">
                {menuData.menus.map((menu: string, i: number) => (
                  <div key={i}>
                    {/* 섹션 배경 및 텍스트 */}
                    <div className="absolute w-full h-full" style={{ transform: `rotate(${i * 60}deg)`, transformOrigin: '50% 50%' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 flex justify-center pt-8">
                        <span className="text-white font-bold text-[11px] whitespace-nowrap writing-vertical-rl">{menu}</span>
                      </div>
                    </div>
                    {/* [복구] 섹션 구분선 */}
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-slate-600 origin-bottom" 
                      style={{ transform: `rotate(${i * 60 + 30}deg)` }}
                    />
                  </div>
                ))}
                {/* 중앙 핀 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 border-4 border-slate-600 rounded-full z-10 shadow-inner" />
              </div>
            </div>

            {!finalMenu ? (
              <button onClick={spinWheel} disabled={isSpinning} className="px-12 py-4 bg-indigo-600 rounded-full font-bold shadow-xl animate-pulse border border-indigo-400">
                 {isSpinning ? "분석된 메뉴 배치 중..." : "돌림판 돌리기"}
              </button>
            ) : (
              <div className="text-center animate-fade-in-up w-full px-4">
                <p className="text-slate-500 text-[10px] mb-2 font-mono uppercase tracking-[0.2em]">Decision Made</p>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">{finalMenu}</h2>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={fetchMenus} className="py-4 bg-slate-800 rounded-2xl text-xs font-bold text-slate-400 border border-slate-700">다시 추천</button>
                   <button onClick={() => router.push(`/restaurant-map?menu=${finalMenu}`)} className="py-4 bg-emerald-600 rounded-2xl text-xs font-bold shadow-lg">🗺️ 주변 식당 찾기</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}