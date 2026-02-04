'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WeatherPage() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/weather/current?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          setWeather(data);
        } catch (err) {
          console.error("날씨 로딩 실패:", err);
        } finally {
          setLoading(false);
        }
      });
    }
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-mono">기상청 연결 중...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-4 mb-4">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white">← 뒤로</button>
        <h1 className="text-xl font-bold">오늘의 날씨</h1>
      </header>

      <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl text-center">
        <p className="text-emerald-400 font-bold mb-2">현재 기온</p>
        <h2 className="text-7xl font-black text-white mb-6 font-mono">{weather?.temp}°</h2>
        <div className="inline-block px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-400 font-bold border border-emerald-500/20">
          {weather?.condition}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-500 mb-1">습도</p>
          <p className="text-xl font-bold">{weather?.humidity}%</p>
        </div>
        <div className="p-6 rounded-3xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-500 mb-1">풍속</p>
          <p className="text-xl font-bold">{weather?.wind} m/s</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-800/30 border border-slate-800 text-center">
        <p className="text-sm text-slate-400">
          기상청 초단기실황 데이터를 바탕으로 제공됩니다.
        </p>
      </div>
    </div>
  );
}