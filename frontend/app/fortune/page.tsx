'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FortuneResult {
  total_score: number;
  comment: string;
  lucky_numbers: number[];
  lucky_color: string;
  wealth_luck: string;
}

export default function FortunePage() {
  const [userData, setUserData] = useState({
    birthDate: '',
    birthTime: '',
    gender: '남성'
  });
  const [fortuneData, setFortuneData] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 로또 공 색상 스타일 헬퍼 (행운의 숫자 표시용)
  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-yellow-500 border-yellow-600';
    if (num <= 20) return 'bg-blue-500 border-blue-600';
    if (num <= 30) return 'bg-red-500 border-red-600';
    if (num <= 40) return 'bg-gray-500 border-gray-600';
    return 'bg-green-500 border-green-600';
  };

  useEffect(() => {
    const saved = localStorage.getItem('murro_user_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserData(parsed);
      // 저장된 정보가 있으면 바로 분석 실행
      fetchFortune(parsed);
    }
  }, []);

  const fetchFortune = async (data: typeof userData) => {
    if (!data.birthDate) return;
    setLoading(true);
    setFortuneData(null);
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          birthDate: data.birthDate, 
          birthTime: data.birthTime, 
          gender: data.gender 
        })
      });
      const result = await res.json();
      setFortuneData(result);
    } catch (error) {
      alert("운세를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndFetch = () => {
    if (!userData.birthDate) return alert("생년월일을 입력해주세요!");
    localStorage.setItem('murro_user_info', JSON.stringify(userData));
    fetchFortune(userData);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <header className="w-full max-w-2xl flex justify-between py-6">
        <Link href="/" className="text-slate-400 font-bold">← BACK</Link>
        <h1 className="text-xl font-bold font-mono text-purple-400">FORTUNE LAB</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-2xl space-y-8 pb-20">
        {/* 사주 정보 입력 섹션 */}
        <section className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <h2 className="text-sm font-bold mb-6 text-center text-slate-400 uppercase tracking-widest">분석 데이터 입력</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-slate-500 mb-2 text-[10px] font-mono uppercase">Birth Date</label>
                <input type="date" value={userData.birthDate} onChange={(e) => setUserData({...userData, birthDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm [color-scheme:dark] outline-none focus:ring-2 focus:ring-purple-500"/>
              </div>
              <div className="flex-1">
                <label className="block text-slate-500 mb-2 text-[10px] font-mono uppercase">Birth Time</label>
                <input type="time" value={userData.birthTime} onChange={(e) => setUserData({...userData, birthTime: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm [color-scheme:dark] outline-none focus:ring-2 focus:ring-purple-500"/>
              </div>
            </div>
            <div>
              <label className="block text-slate-500 mb-2 text-[10px] font-mono uppercase">Gender</label>
              <div className="flex gap-4">
                {['남성', '여성'].map((g) => (
                  <label key={g} className={`flex-1 p-3 rounded-xl border cursor-pointer text-center transition-all text-sm font-bold ${userData.gender === g ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                    <input type="radio" name="gender" value={g} checked={userData.gender === g} onChange={() => setUserData({...userData, gender: g})} className="hidden"/>{g}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleSaveAndFetch} disabled={loading} className="w-full py-4 mt-2 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.01] transition-transform shadow-xl">
              {loading ? "데이터 분석 중... 🧘‍♂️" : "운세 분석 시작"}
            </button>
          </div>
        </section>

        {/* 분석 결과 섹션 (기존 스타일 완벽 복구) */}
        {fortuneData && (
          <section className="animate-fade-in-up">
            <div className="bg-slate-800 border border-purple-500/50 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🔮</div>
              <div className="text-center mb-8 border-b border-slate-700 pb-6">
                <div className="text-6xl mb-4">{fortuneData.wealth_luck}</div>
                <h3 className="text-2xl font-black text-purple-300 font-mono italic">SCORE: {fortuneData.total_score}</h3>
                <p className="text-slate-400 text-xs mt-2 font-mono">LUCKY COLOR: <span className="text-white font-bold">{fortuneData.lucky_color}</span></p>
              </div>
              
              <div className="bg-slate-900/80 p-6 rounded-2xl mb-8 border border-slate-700/50">
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                  {fortuneData.comment}
                </p>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-slate-500 mb-4 font-mono uppercase tracking-widest">Lucky Numbers</p>
                <div className="flex justify-center gap-3">
                  {fortuneData.lucky_numbers.map((num, i) => (
                    <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold shadow-lg border-b-4 ${getBallColor(num)}`}>
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}