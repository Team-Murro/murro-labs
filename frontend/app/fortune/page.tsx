'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FortunePage() {
  const [userData, setUserData] = useState({ birthDate: '', gender: '남성' });
  const [result, setResult] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('murro_user_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserData(parsed);
      setIsSaved(true);
      handleFetch(parsed);
    }
  }, []);

  const handleFetch = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fortune?birthDate=${data.birthDate}&gender=${data.gender}`);
      const json = await res.json();
      setResult(json);
    } finally { setLoading(false); }
  };

  const saveAndFetch = () => {
    localStorage.setItem('murro_user_info', JSON.stringify(userData));
    setIsSaved(true);
    handleFetch(userData);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0f172a] text-white p-6">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <Link href="/" className="text-slate-400 hover:text-white font-bold">← 대시보드</Link>
        <h1 className="text-xl font-black text-purple-400">MURRO FORTUNE</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        <section className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" value={userData.birthDate} onChange={(e) => setUserData({...userData, birthDate: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm [color-scheme:dark]" />
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
              {['남성', '여성'].map(g => (
                <button key={g} onClick={() => setUserData({...userData, gender: g})} className={`flex-1 py-2 text-xs rounded-lg ${userData.gender === g ? 'bg-purple-600 font-bold' : 'text-slate-500'}`}>{g}</button>
              ))}
            </div>
            <button onClick={saveAndFetch} className="md:col-span-2 py-3 bg-purple-600 rounded-xl font-bold hover:bg-purple-500 transition-all">운세 분석하기 ✨</button>
          </div>
        </section>

        {result && (
          <section className="p-8 bg-slate-800/50 rounded-3xl border border-purple-500/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-black mb-4 text-center">오늘의 행운 보고서</h3>
            <p className="text-slate-300 leading-relaxed text-center italic">"{result.summary || '준비된 운세가 도착했습니다. 긍정적인 마음으로 하루를 시작하세요!'}"</p>
            {/* 추가 상세 운세 데이터는 result 구조에 맞춰 배치 */}
          </section>
        )}
      </main>
    </div>
  );
}