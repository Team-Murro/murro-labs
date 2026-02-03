'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FortunePage() {
  const [userData, setUserData] = useState({
    birthDate: '',
    birthTime: '',
    gender: '남성'
  });
  const [fortuneResult, setFortuneResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('murro_user_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserData(parsed);
      setIsSaved(true);
      fetchFortune(parsed);
    }
  }, []);

  const fetchFortune = async (data: typeof userData) => {
    setLoading(true);
    try {
      // 실제 백엔드 API 엔드포인트에 맞춰 수정 필요
      const res = await fetch(`/api/fortune?birthDate=${data.birthDate}&gender=${data.gender}`);
      const result = await res.json();
      setFortuneResult(result);
    } catch (err) {
      console.error("운세 정보 로드 실패", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!userData.birthDate) return alert("생년월일을 선택해주세요.");
    localStorage.setItem('murro_user_info', JSON.stringify(userData));
    setIsSaved(true);
    fetchFortune(userData);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0f172a] text-white p-6">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <Link href="/" className="text-slate-400 hover:text-white">← 돌아가기</Link>
        <h1 className="text-xl font-bold font-mono">FORTUNE LAB</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        {/* 사용자 정보 설정 */}
        <section className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl">
          <h2 className="text-sm font-bold text-purple-400 mb-4 font-mono">USER PROFILE</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className="text-[10px] text-slate-500 ml-1 mb-1 block">생년월일</label>
              <input 
                type="date" 
                value={userData.birthDate}
                onChange={(e) => setUserData({...userData, birthDate: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 ml-1 mb-1 block">성별</label>
              <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
                {['남성', '여성'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setUserData({...userData, gender: g})}
                    className={`flex-1 py-2 text-xs rounded-lg transition-all ${userData.gender === g ? 'bg-purple-600 text-white font-bold' : 'text-slate-500'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 ml-1 mb-1 block">저장</label>
              <button 
                onClick={handleSave}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-colors"
              >
                정보 업데이트
              </button>
            </div>
          </div>
        </section>

        {/* 운세 결과 출력 */}
        <section className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-purple-500/20 shadow-2xl min-h-[300px] flex flex-col items-center justify-center text-center">
          {loading ? (
            <div className="animate-pulse flex flex-col items-center">
              <span className="text-4xl mb-4">🔮</span>
              <p className="text-slate-400">당신의 운명을 분석하는 중...</p>
            </div>
          ) : fortuneResult ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="text-5xl mb-6 block text-purple-400">✨</span>
              <h3 className="text-2xl font-black mb-4">오늘의 종합 운세</h3>
              <p className="text-slate-300 leading-relaxed text-lg italic">
                "{fortuneResult.summary || '오늘은 평소보다 에너지가 넘치는 날입니다. 계획했던 일을 실행에 옮겨보세요.'}"
              </p>
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 mb-1">재물운</p>
                  <p className="text-xl">💰</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 mb-1">연애운</p>
                  <p className="text-xl">❤️</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 mb-1">성공운</p>
                  <p className="text-xl">🚀</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">정보를 저장하고 오늘의 행운을 확인하세요.</p>
          )}
        </section>
      </main>
    </div>
  );
}