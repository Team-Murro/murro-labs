'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FortunePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [userData, setUserData] = useState({ birthDate: '', birthTime: '', gender: '남성' });
  const [fortuneData, setFortuneData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('murro_user_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserData(parsed);
      fetchFortune(parsed);
    }
  }, []);

  const fetchFortune = async (data: any) => {
    if (!data.birthDate) return;
    setLoading(true);
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      setFortuneData(result);
    } catch (e) { alert("오류 발생"); }
    finally { setLoading(false); }
  };

  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-yellow-500 border-yellow-600';
    if (num <= 20) return 'bg-blue-500 border-blue-600';
    if (num <= 30) return 'bg-red-500 border-red-600';
    if (num <= 40) return 'bg-gray-500 border-gray-600';
    return 'bg-green-500 border-green-600';
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <header className="w-full max-w-2xl flex justify-between py-6">
        <Link href="/" className="text-slate-400 font-bold">← BACK</Link>
        <h1 className="text-xl font-bold">🔮 오늘의 운세</h1>
        <div className="w-10"></div>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
           <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-slate-500 mb-2 text-xs font-mono">BIRTH DATE</label>
                  <input type="date" value={userData.birthDate} onChange={(e) => setUserData({...userData, birthDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm [color-scheme:dark]"/>
                </div>
                <div className="flex-1">
                  <label className="block text-slate-500 mb-2 text-xs font-mono">TIME</label>
                  <input type="time" value={userData.birthTime} onChange={(e) => setUserData({...userData, birthTime: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm [color-scheme:dark]"/>
                </div>
              </div>
              <div>
                 <label className="block text-slate-500 mb-2 text-xs font-mono">GENDER</label>
                 <div className="flex gap-3">
                    {['남성', '여성'].map(g => (
                      <button key={g} onClick={() => setUserData({...userData, gender: g})} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${userData.gender === g ? 'bg-purple-600 border-purple-500' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>{g}</button>
                    ))}
                 </div>
              </div>
              <button onClick={() => {localStorage.setItem('murro_user_info', JSON.stringify(userData)); fetchFortune(userData);}} disabled={loading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold shadow-lg">
                {loading ? "분석 중..." : "운세 데이터 분석 시작"}
              </button>
           </div>
        </div>

        {fortuneData && (
          <div className="bg-slate-800 border border-purple-500/50 rounded-3xl p-8 shadow-2xl animate-fade-in-up">
            <div className="text-center mb-8 border-b border-slate-700 pb-6">
              <div className="text-6xl mb-4">{fortuneData.wealth_luck}</div>
              <h3 className="text-2xl font-bold text-purple-300 font-mono">SCORE: {fortuneData.total_score}</h3>
              <p className="text-slate-400 text-xs mt-2">LUCKY COLOR: <span className="text-white font-bold">{fortuneData.lucky_color}</span></p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl mb-8 border border-slate-700">
               <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{fortuneData.comment}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-4 font-mono">LUCKY NUMBERS</p>
              <div className="flex justify-center gap-2">
                {fortuneData.lucky_numbers.map((n: number, i: number) => (
                  <div key={i} className={`w-9 h-9 flex items-center justify-center rounded-full text-white font-bold text-sm border-b-2 shadow-md ${getBallColor(n)}`}>{n}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}