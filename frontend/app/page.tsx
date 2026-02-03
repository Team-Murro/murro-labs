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

  useEffect(() => {
    // 1. 메인에서 보여줄 간단한 로또 정보 로드
    fetch('/api/lotto/latest')
      .then(res => res.json())
      .then(data => setLotto(data))
      .catch(err => console.error("데이터 로드 실패", err));

    // 2. 저장된 사용자 정보가 있는지 확인 (운세 위젯용)
    const savedData = localStorage.getItem('murro_user_info');
    if (savedData) {
      setUserData(JSON.parse(savedData));
      setIsDataSaved(true);
    }
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen text-white p-4 font-sans bg-[#0f172a]">
      
      {/* 배너 섹션 */}
      <div className="w-full max-w-2xl mb-8 relative rounded-3xl overflow-hidden border border-slate-700 aspect-[3/1]">
         <Image 
            src="/hero-banner.jpg" 
            alt="MURRO LABS" 
            fill 
            className="object-cover"
            priority 
         />
      </div>

      {/* [섹션 1] 🧪 머로 연구소 */}
      <div className="w-full max-w-2xl mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center px-1">
          <span className="mr-2">🧪</span> 머로 연구소
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 로또 분석기 카드 */}
          <div 
            onClick={() => router.push('/lotto')} 
            className="md:col-span-2 p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-blue-400 font-mono text-[10px] tracking-widest uppercase">Lotto Lab</h3>
              <span className="text-slate-500 group-hover:text-blue-400 transition-colors">→</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold">로또 분석기</h4>
                <p className="text-xs text-slate-400 mt-1">AI 기반 번호 예측 및 당첨 통계</p>
              </div>
              {lotto && (
                <div className="flex gap-1">
                  {[lotto.num1, lotto.num2, lotto.num3].map((n: number, i: number) => (
                    <span key={i} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold border-b-2 border-slate-900">{n}</span>
                  ))}
                  <span className="text-slate-600">...</span>
                </div>
              )}
            </div>
          </div>

          {/* 오늘의 운세 카드 */}
          <div 
            onClick={() => router.push('/fortune')}
            className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-purple-400 font-mono text-[10px] tracking-widest uppercase">Fortune Lab</h3>
              <span className="text-slate-500 group-hover:text-purple-400">→</span>
            </div>
            <h4 className="text-lg font-bold">오늘의 운세</h4>
            <p className="text-xs text-slate-400 mt-1">
              {isDataSaved ? `${userData.birthDate}님을 위한 분석` : '생년월일 기반 운세 분석'}
            </p>
          </div>

          {/* 메뉴 추천 카드 */}
          <div 
            onClick={() => router.push('/menu')}
            className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-orange-400 font-mono text-[10px] tracking-widest uppercase">Menu Lab</h3>
              <span className="text-slate-500 group-hover:text-orange-400">→</span>
            </div>
            <h4 className="text-lg font-bold">메뉴 추천</h4>
            <p className="text-xs text-slate-400 mt-1">결정 장애를 해결하는 돌림판</p>
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
              <div className="w-12 h-12 bg-red-900/20 rounded-2xl flex items-center justify-center text-2xl border border-red-500/20 group-hover:scale-110 transition-transform">⚖️</div>
              <div>
                <h3 className="font-bold text-slate-200 group-hover:text-red-400 transition-colors">무한 밸런스 게임</h3>
                <p className="text-xs text-slate-500 mt-1">당신의 선택을 데이터로 확인하세요.</p>
              </div>
            </div>
            <span className="text-slate-600 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </div>

      {/* [섹션 3] 📚 머로 라이프 */}
      <div className="w-full max-w-2xl mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center px-1 text-slate-400">
          <span className="mr-2">📚</span> 머로 라이프
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-8 bg-slate-800/20 border border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center opacity-40">
             <span className="text-2xl mb-2">🚧</span>
             <span className="text-[10px] font-bold text-slate-600 font-mono tracking-widest">준비 중</span>
          </div>
          <div className="p-8 bg-slate-800/20 border border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center opacity-40">
             <span className="text-2xl mb-2">🚧</span>
             <span className="text-[10px] font-bold text-slate-600 font-mono tracking-widest">준비 중</span>
          </div>
        </div>
      </div>
    </div>
  );
}