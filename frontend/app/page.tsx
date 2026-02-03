'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [lotto, setLotto] = useState<any>(null);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [userData, setUserData] = useState({ birthDate: '', gender: '남성' });

  // 공 색상 로직 복구
  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-yellow-500 border-yellow-600';
    if (num <= 20) return 'bg-blue-500 border-blue-600';
    if (num <= 30) return 'bg-red-500 border-red-600';
    if (num <= 40) return 'bg-gray-500 border-gray-600';
    return 'bg-green-500 border-green-600';
  };

  useEffect(() => {
    fetch('/api/lotto/latest')
      .then(res => res.json())
      .then(data => setLotto(data))
      .catch(err => console.error(err));

    const savedData = localStorage.getItem('murro_user_info');
    if (savedData) {
      setUserData(JSON.parse(savedData));
      setIsDataSaved(true);
    }
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen text-white p-4 font-sans bg-[#0f172a]">
      {/* 배너 섹션 */}
      <div className="w-full max-w-2xl mb-8 relative rounded-3xl overflow-hidden border border-slate-700 aspect-[2/1] md:aspect-[3/1]">
         <Image src="/hero-banner.jpg" alt="MURRO LABS" fill className="object-cover" priority />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent">
           <div className="absolute bottom-4 left-6">
              <h1 className="text-2xl font-bold text-white">MURRO LABS</h1>
              <p className="text-xs text-slate-300">데이터와 AI로 일상의 행운을 실험하다</p>
           </div>
         </div>
      </div>

      {/* 🧪 머로 연구소 섹션 */}
      <div className="w-full max-w-2xl mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center px-1"><span className="mr-2">🧪</span> 머로 연구소</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 로또 카드 - 명예의 전당 및 당첨번호 시각화 복구 */}
          <div onClick={() => router.push('/lotto')} className="md:col-span-2 p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold text-blue-400 font-mono tracking-widest uppercase">Lotto Lab</h3>
              <span className="text-slate-500 group-hover:text-blue-400">명예의 전당 보기 →</span>
            </div>
            {lotto ? (
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-2xl font-black">{lotto.turn}회</h4>
                  <p className="text-xs text-slate-400">{lotto.draw_date}</p>
                </div>
                <div className="flex gap-1.5">
                  {[lotto.num1, lotto.num2, lotto.num3, lotto.num4, lotto.num5, lotto.num6].map((n, i) => (
                    <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold border-b-2 border-black/20 ${getBallColor(n)}`}>{n}</span>
                  ))}
                </div>
              </div>
            ) : <div className="animate-pulse text-slate-500 text-sm">로딩 중...</div>}
          </div>

          {/* 운세 카드 */}
          <div onClick={() => router.push('/fortune')} className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-all group">
            <h3 className="text-xs font-bold text-purple-400 font-mono mb-2 uppercase">Fortune Lab</h3>
            <h4 className="text-lg font-bold">오늘의 운세</h4>
            <p className="text-xs text-slate-400 mt-1">{isDataSaved ? `${userData.birthDate}님 분석 중` : '정보 입력 후 확인'}</p>
          </div>

          {/* 메뉴 추천 카드 */}
          <div onClick={() => router.push('/menu')} className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-all group">
            <h3 className="text-xs font-bold text-orange-400 font-mono mb-2 uppercase">Menu Lab</h3>
            <h4 className="text-lg font-bold">메뉴 추천</h4>
            <p className="text-xs text-slate-400 mt-1">AI 위치 기반 메뉴 결정</p>
          </div>
        </div>
      </div>

      {/* 🎡 머로 놀이터 - 밸런스 게임 및 명당 지도 링크 복구 */}
      <div className="w-full max-w-2xl mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center px-1"><span className="mr-2">🎡</span> 머로 놀이터</h2>
        <div className="grid grid-cols-2 gap-4">
           <Link href="/balance" className="p-5 bg-slate-800 border border-slate-700 rounded-3xl hover:border-red-500 transition-all flex flex-col items-center">
              <span className="text-3xl mb-2">⚖️</span>
              <span className="font-bold text-sm">밸런스 게임</span>
           </Link>
           <Link href="/map" className="p-5 bg-slate-800 border border-slate-700 rounded-3xl hover:border-emerald-500 transition-all flex flex-col items-center">
              <span className="text-3xl mb-2">🗺️</span>
              <span className="font-bold text-sm">명당 지도</span>
           </Link>
        </div>
      </div>

      {/* 📚 머로 라이프 */}
      <div className="w-full max-w-2xl mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center px-1 text-slate-400"><span className="mr-2">📚</span> 머로 라이프</h2>
        <div className="grid grid-cols-2 gap-4 opacity-40">
          <div className="p-8 border border-slate-800 border-dashed rounded-3xl flex flex-col items-center"><span className="text-xl mb-1">🚧</span><span className="text-[10px] font-mono tracking-widest">준비 중</span></div>
          <div className="p-8 border border-slate-800 border-dashed rounded-3xl flex flex-col items-center"><span className="text-xl mb-1">🚧</span><span className="text-[10px] font-mono tracking-widest">준비 중</span></div>
        </div>
      </div>
    </div>
  );
}