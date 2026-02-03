'use client';

import { useState, useRef } from 'react';
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
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch('/api/menu/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      });
      const data = await res.json();
      setMenuData(data);
      setLoading(false);
    }, () => { alert("위치 권한을 허용해주세요."); setLoading(false); });
  };

  const spinWheel = () => {
    if (!menuData || isSpinning) return;
    setIsSpinning(true);
    setFinalMenu(null);
    const randomDeg = Math.floor(Math.random() * 360);
    const totalDeg = 360 * 5 + randomDeg; 
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
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
        <h1 className="text-xl font-bold font-mono">MENU RESEARCH</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-md flex flex-col items-center py-10 space-y-10">
        {!menuData ? (
          <div className="text-center space-y-6">
            <div className="text-7xl grayscale opacity-30">🍽️</div>
            <h2 className="text-xl font-bold">오늘 뭐 먹을까요?</h2>
            <p className="text-slate-400 text-sm leading-relaxed">위치, 날씨, 시간을 분석하여<br/>당신을 위한 메뉴 6가지를 엄선합니다.</p>
            <button onClick={fetchMenus} disabled={loading} className="px-10 py-4 bg-orange-600 rounded-2xl font-bold shadow-lg">
               {loading ? "분석중..." : "분석 시작하기"}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-slate-800 p-4 rounded-2xl text-center border border-orange-500/20 w-full shadow-lg">
               <p className="text-orange-400 font-bold mb-1 text-xs">AI 추천 코멘트</p>
               <p className="text-slate-300 text-sm leading-relaxed">"{menuData.reason}"</p>
            </div>

            {/* 기존 돌림판 UI 완벽 복구 */}
            <div className="relative w-72 h-72">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 text-red-500 text-4xl">▼</div>
               <div ref={wheelRef} className="w-full h-full rounded-full border-4 border-slate-200 overflow-hidden relative shadow-2xl bg-slate-700">
                  {menuData.menus.map((menu: string, i: number) => (
                    <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * 60 + 30}deg)`, transformOrigin: '50% 50%' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-6">
                        <span className="text-white font-bold text-[10px] whitespace-nowrap writing-vertical-rl">{menu}</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {!finalMenu ? (
              <button onClick={spinWheel} disabled={isSpinning} className="px-12 py-4 bg-indigo-600 rounded-full font-bold shadow-xl animate-bounce">
                 {isSpinning ? "운명의 선택 중..." : "돌림판 돌리기"}
              </button>
            ) : (
              <div className="text-center animate-fade-in-up w-full">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">{finalMenu}</h2>
                <div className="flex gap-4">
                   <button onClick={fetchMenus} className="flex-1 py-4 bg-slate-800 rounded-2xl text-sm font-bold">다시 추천</button>
                   <button onClick={() => router.push(`/restaurant-map?menu=${finalMenu}`)} className="flex-1 py-4 bg-emerald-600 rounded-2xl text-sm font-bold">🗺️ 식당 찾기</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}