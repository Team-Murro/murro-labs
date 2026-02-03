'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ... (기존 LottoData, FortuneResult 등 인터페이스 유지)

export default function Home() {
  // --- 공통 상태 ---
  const [lotto, setLotto] = useState<any>(null);
  const [fortuneData, setFortuneData] = useState<any>(null);
  const [loading, setLoading] = useState({ lotto: false, fortune: false });

  // --- 운세 입력 상태 (초기값은 로컬스토리지에서 확인) ---
  const [userData, setUserData] = useState({
    birthDate: '',
    birthTime: '',
    gender: '남성'
  });

  useEffect(() => {
    // 최신 로또 정보 가져오기
    fetch('/api/lotto/latest').then(res => res.json()).then(data => setLotto(data));

    // 로컬스토리지에서 사용자 정보 불러오기
    const savedData = localStorage.getItem('murro_user_info');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setUserData(parsed);
      // 저장된 데이터가 있으면 바로 운세 조회 로직 실행 가능 (선택 사항)
    }
  }, []);

  const saveUserInfo = (data: typeof userData) => {
    localStorage.setItem('murro_user_info', JSON.stringify(data));
    alert("정보가 저장되었습니다. 이제 접속 시 바로 운세를 확인할 수 있습니다.");
  };

  return (
    <div className="flex flex-col items-center min-h-screen text-white p-4 font-sans bg-[#0f172a]">
      {/* 배너 섹션 */}
      <div className="w-full max-w-2xl mb-8 relative rounded-3xl overflow-hidden border border-slate-700 aspect-[3/1]">
         <Image src="/hero-banner.jpg" alt="MURRO LABS" fill className="object-cover" priority />
      </div>

      {/* [섹션 1] 🧪 머로 연구소 - 대시보드 그리드 */}
      <div className="w-full max-w-2xl mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center"><span className="mr-2">🧪</span> 머로 연구소</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 로또 위젯 (가로 전체 사용) */}
          <div className="md:col-span-2 p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl">
            <h3 className="text-sm font-bold text-blue-400 mb-3 font-mono">LATEST LOTTO</h3>
            {lotto ? (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold">{lotto.turn}회</span>
                  <p className="text-xs text-slate-400">{lotto.draw_date}</p>
                </div>
                <div className="flex gap-1">
                  {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((n, i) => (
                    <span key={i} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 text-xs font-bold">{n}</span>
                  ))}
                </div>
              </div>
            ) : <div className="animate-pulse text-slate-500">Loading...</div>}
          </div>

          {/* 운세 위젯 (브라우저 저장 기능 포함) */}
          <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl">
            <h3 className="text-sm font-bold text-purple-400 mb-3 font-mono">DAILY FORTUNE</h3>
            <input 
              type="date" 
              value={userData.birthDate} 
              onChange={(e) => setUserData({...userData, birthDate: e.target.value})}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs mb-2 outline-none [color-scheme:dark]"
            />
            <button 
              onClick={() => saveUserInfo(userData)}
              className="w-full py-2 bg-purple-600 rounded-lg text-xs font-bold hover:bg-purple-500 transition-colors"
            >
              정보 저장 및 운세 보기
            </button>
          </div>

          {/* 메뉴 추천 위젯 */}
          <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl flex flex-col justify-between">
            <h3 className="text-sm font-bold text-orange-400 mb-2 font-mono">LUNCH PICK</h3>
            <p className="text-xs text-slate-400 mb-4">결정 장애를 해결해드립니다.</p>
            <Link href="/?tab=menu" className="w-full py-2 bg-slate-700 rounded-lg text-center text-xs font-bold hover:bg-slate-600">
              돌림판 돌리기 🎡
            </Link>
          </div>
        </div>
      </div>

      {/* [섹션 2] 🎡 머로 놀이터 */}
      <div className="w-full max-w-2xl mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center"><span className="mr-2">🎡</span> 머로 놀이터</h2>
        <Link href="/balance" className="block p-5 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-750 transition-all">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-200">무한 밸런스 게임 ⚖️</h3>
              <p className="text-xs text-slate-500 mt-1">당신의 선택은 어느 쪽인가요?</p>
            </div>
            <span className="text-slate-600">→</span>
          </div>
        </Link>
      </div>

      {/* [섹션 3] 📚 머로라이프 (신규) */}
      <div className="w-full max-w-2xl mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center"><span className="mr-2">📚</span> 머로라이프</h2>
        <div className="grid grid-cols-2 gap-3">
          {['뉴스피드', '분리수거 가이드', '연봉 실수령액', '오늘의 날씨'].map((item) => (
            <div key={item} className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl flex flex-col items-center justify-center opacity-60">
               <span className="text-xl mb-1">🚧</span>
               <span className="text-xs font-bold text-slate-500">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}