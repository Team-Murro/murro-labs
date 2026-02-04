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
    setMenuData(null);
    setFinalMenu(null);

    // 휠 초기화 (다시 돌릴 때를 위해 0도로 리셋)
    if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = 'rotate(0deg)';
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch('/api/menu/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        });
        const data = await res.json();
        
        // [중요] 백엔드가 selected_index를 안 줄 경우를 대비한 안전장치
        if (typeof data.selected_index !== 'number') {
            data.selected_index = 0; 
        }
        setMenuData(data);
      } catch (e) { 
          alert("메뉴 추천을 받아오지 못했습니다. 잠시 후 다시 시도해주세요."); 
      } finally { 
          setLoading(false); 
      }
    }, () => { 
        alert("위치 권한을 허용해주세요."); 
        setLoading(false); 
    });
  };

  const spinWheel = () => {
    if (!menuData || isSpinning) return;
    setIsSpinning(true);
    setFinalMenu(null);

    // [핵심 로직] 백엔드가 정해준 인덱스(targetIndex)에 정확히 멈추는 각도 계산
    // 원리: 화살표는 12시(0도) 고정. 
    // 아이템 0번은 0도, 1번은 60도... 에 위치함.
    // 1번(60도)을 12시로 가져오려면 휠을 반시계로 60도(또는 시계로 300도) 돌려야 함.
    // 공식: 360 * 회전수 + (360 - (인덱스 * 60))
    const targetIndex = menuData.selected_index;
    const itemAngle = 60; // 6등분
    const targetDeg = 360 * 5 + (360 - (targetIndex * itemAngle)); 

    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)'; // 쫀득한 감속 효과
      wheelRef.current.style.transform = `rotate(${targetDeg}deg)`;
    }

    setTimeout(() => {
      setIsSpinning(false);
      // 백엔드가 정한 결과 그대로 노출 (계산 오차 없음)
      setFinalMenu(menuData.menus[targetIndex]);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <header className="w-full max-w-md flex justify-between py-6">
        <Link href="/" className="text-slate-400 font-bold hover:text-white transition-colors">← BACK</Link>
        <h1 className="text-xl font-bold font-mono text-orange-500">MENU PICK</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-md flex flex-col items-center space-y-10 py-6">
        {!menuData ? (
          <div className="text-center space-y-6 py-10 animate-fade-in-up">
            <div className="text-7xl grayscale opacity-30">🍽️</div>
            <h2 className="text-xl font-bold">오늘의 최적 메뉴는?</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
                현재 계신 곳의 날씨와 시간을 분석하여<br/>
                가장 어울리는 메뉴를 AI가 선정합니다.
            </p>
            <button 
                onClick={fetchMenus} 
                disabled={loading} 
                className="px-10 py-4 bg-orange-600 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
               {loading ? "데이터 분석 중..." : "추천 시작하기"}
            </button>
          </div>
        ) : (
          <>
            {/* AI 분석 결과 말풍선 */}
            <div className="bg-slate-800 p-5 rounded-2xl text-center border border-orange-500/30 w-full shadow-lg relative animate-fade-in-down">
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-b border-r border-orange-500/30 rotate-45"></div>
               <p className="text-orange-400 font-bold mb-2 text-[10px] uppercase tracking-widest">AI Reasoning</p>
               <p className="text-slate-200 text-sm leading-relaxed italic break-keep">"{menuData.reason}"</p>
            </div>

            {/* 휠 영역 */}
            <div className="relative w-80 h-80 my-4">
              {/* 화살표 (12시 방향 고정) */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 text-red-500 text-5xl drop-shadow-xl filter">▼</div>
              
              <div 
                ref={wheelRef} 
                className="w-full h-full rounded-full border-[8px] border-slate-800 overflow-hidden relative shadow-2xl bg-slate-800 box-border"
              >
                {menuData.menus.map((menu: string, i: number) => (
                  <div key={i} className="absolute inset-0">
                    {/* 섹션 배경 (홀짝 색상 구분으로 시인성 확보) */}
                    <div 
                        className="absolute w-full h-full origin-center"
                        style={{ 
                            transform: `rotate(${i * 60}deg)`,
                            clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 36.6%)' // 6등분 정밀 클리핑 (대략적) 
                            // *참고: CSS clip-path로 완벽한 부채꼴은 복잡하므로, 
                            // 여기서는 텍스트와 구분선 위주로 구현하고 배경은 심플하게 처리
                        }}
                    >
                    </div>

                    {/* 텍스트 (중심축 회전) */}
                    <div 
                        className="absolute w-full h-full text-center pt-6"
                        style={{ transform: `rotate(${i * 60}deg)` }}
                    >
                      <span className="inline-block text-white font-bold text-sm tracking-tighter drop-shadow-md">
                        {menu}
                      </span>
                    </div>

                    {/* 섹션 구분선 */}
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-1/2 bg-slate-600/50 origin-bottom" 
                      style={{ transform: `rotate(${i * 60 + 30}deg)` }}
                    />
                  </div>
                ))}
                
                {/* 휠 중앙 장식 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-800 rounded-full z-10 flex items-center justify-center border-4 border-slate-700 shadow-inner">
                    <span className="text-2xl">🍴</span>
                </div>
              </div>
            </div>

            {/* 버튼 및 결과 영역 */}
            {!finalMenu ? (
              <button 
                onClick={spinWheel} 
                disabled={isSpinning} 
                className="px-12 py-4 bg-indigo-600 rounded-full font-bold shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-pulse border border-indigo-400 hover:bg-indigo-500 transition-colors"
              >
                  {isSpinning ? "신중하게 고르는 중..." : "돌림판 돌리기"}
              </button>
            ) : (
              <div className="text-center animate-bounce-in w-full px-4">
                <p className="text-slate-500 text-[10px] mb-2 font-mono uppercase tracking-[0.2em]">Best Choice</p>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8 drop-shadow-sm">
                    {finalMenu}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={fetchMenus} className="py-4 bg-slate-800 rounded-2xl text-xs font-bold text-slate-400 border border-slate-700 hover:bg-slate-700 transition-colors">
                       다시 추천받기
                   </button>
                   <button onClick={() => router.push(`/restaurant-map?menu=${finalMenu}`)} className="py-4 bg-emerald-600 rounded-2xl text-xs font-bold shadow-lg text-white hover:bg-emerald-500 transition-colors">
                       🗺️ 주변 식당 찾기
                   </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}