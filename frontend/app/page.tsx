'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  // --- 공통 상태 ---
  const [lotto, setLotto] = useState<any>(null);
  const [userData, setUserData] = useState({
    birthDate: '',
    birthTime: '',
    gender: '남성'
  });
  const [isDataSaved, setIsDataSaved] = useState(false);

  useEffect(() => {
    // 1. 최신 로또 정보 가져오기
    fetch('/api/lotto/latest')
      .then(res => res.json())
      .then(data => setLotto(data))
      .catch(err => console.error("로또 데이터 로드 실패", err));

    // 2. LocalStorage에서 사용자 정보 확인
    const savedData = localStorage.getItem('murro_user_info');
    if (savedData) {
      setUserData(JSON.parse(savedData));
      setIsDataSaved(true);
    }
  }, []);

  const saveUserInfo = () => {
    if (!userData.birthDate) return alert("생년월일을 입력해주세요.");
    localStorage.setItem('murro_user_info', JSON.stringify(userData));
    setIsDataSaved(true);
    alert("정보가 저장되었습니다! 이제 맞춤형 대시보드를 이용하실 수 있습니다.");
  };

  const resetUserInfo = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if(confirm("저장된 정보를 삭제하시겠습니까?")) {
      localStorage.removeItem('murro_user_info');
      setUserData({ birthDate: '', birthTime: '', gender: '남성' });
      setIsDataSaved(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen text-white p-4 font-sans bg-[#0f172a]">
      
      {/* 배너 섹션 */}
      <div className="w-full max-w-2xl mb-8 relative rounded-3xl overflow-hidden border border-slate-700 aspect-[3/1]">
         <Image src="/hero-banner.jpg" alt="MURRO LABS" fill className="object-cover" priority />
      </div>

      {/* [섹션 1] 🧪 머로 연구소 */}
      <div className="w-full max-w-2xl mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center px-1">
          <span className="mr-2">🧪</span> 머로 연구소
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 로또 위젯 (클릭 시 로또 분석 상세/생성) */}
          <div 
            onClick={() => router.push('/?tab=lotto')} 
            className="md:col-span-2 p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-blue-400 font-mono">로또 분석기</h3>
              <span className="text-slate-500 group-hover:text-blue-400 transition-colors">→</span>
            </div>
            {lotto ? (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold">{lotto.turn}회 결과</span>
                  <p className="text-xs text-slate-400 mt-1">{lotto.draw_date}</p>
                </div>
                <div className="flex gap-1.5">
                  {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((n, i) => (
                    <span key={i} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-xs font-bold border-b-2 border-slate-900">{n}</span>
                  ))}
                </div>
              </div>
            ) : <div className="py-4 text-slate-500 animate-pulse text-sm">데이터를 불러오는 중...</div>}
          </div>

          {/* 운세 위젯 */}
          <div 
            onClick={() => isDataSaved ? router.push('/?tab=fortune') : null}
            className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-purple-400 font-mono">오늘의 운세</h3>
              {isDataSaved && <span className="text-slate-500 group-hover:text-purple-400">→</span>}
            </div>
            
            {!isDataSaved ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="date" 
                  value={userData.birthDate} 
                  onChange={(e) => setUserData({...userData, birthDate: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs outline-none [color-scheme:dark]"
                />
                <button 
                  onClick={saveUserInfo}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-bold hover:opacity-90"
                >
                  분석 정보 저장하기
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full justify-between">
                <p className="text-sm text-slate-300">
                  <span className="text-purple-300 font-bold">{userData.birthDate}</span> 기준<br/>
                  당신의 행운을 분석할 준비가 되었습니다.
                </p>
                <button 
                  onClick={resetUserInfo}
                  className="text-[10px] text-slate-500 mt-4 underline text-left hover:text-red-400"
                >
                  정보 수정하기
                </button>
              </div>
            )}
          </div>

          {/* 메뉴 추천 위젯 */}
          <div 
            onClick={() => router.push('/?tab=menu')}
            className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-orange-400 font-mono">메뉴 추천</h3>
              <span className="text-slate-500 group-hover:text-orange-400">→</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              점심 메뉴 고민 끝!<br/>AI 돌림판으로 결정하세요.
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-orange-900/30 border border-orange-800 text-orange-400 text-[10px] font-bold">
              🎡 돌림판 바로가기
            </div>
          </div>
        </div>
      </div>

      {/* [섹션 2] 🎡 머로 놀이터 */}
      <div className="w-full max-w-2xl mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center px-1">
          <span className="mr-2">🎡</span> 머로 놀이터
        </h2>
        <Link href="/balance" className="block p-6 bg-slate-800/80 border border-slate-700 rounded-3xl hover:border-red-500/50 transition-all shadow-lg group">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-900/20 rounded-2xl flex items-center justify-center text-2xl border border-red-500/20 group-hover:scale-110 transition-transform">
                ⚖️
              </div>
              <div>
                <h3 className="font-bold text-slate-200 group-hover:text-red-400 transition-colors">무한 밸런스 게임</h3>
                <p className="text-xs text-slate-500 mt-1">세상의 모든 난제, 당신의 선택은?</p>
              </div>
            </div>
            <span className="text-slate-600 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </div>

      {/* [섹션 3] 📚 머로 라이프 (확정 명칭 적용) */}
      <div className="w-full max-w-2xl mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center px-1">
          <span className="mr-2">📚</span> 머로 라이프
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {['준비 중', '준비 중'].map((item, idx) => (
            <div key={idx} className="p-8 bg-slate-800/30 border border-slate-800 rounded-3xl flex flex-col items-center justify-center opacity-50 border-dashed">
               <span className="text-2xl mb-2">🚧</span>
               <span className="text-xs font-bold text-slate-500 font-mono tracking-widest">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}