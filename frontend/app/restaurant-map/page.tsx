'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const menu = searchParams.get('menu');
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 카카오맵 스크립트 로드
    const script = document.createElement('script');
    // [확인] 본인의 앱키가 맞는지 확인해주세요
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=93235d64846067035eb54a329759d54e&libraries=services&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          const container = document.getElementById('map');
          const options = { center: new window.kakao.maps.LatLng(lat, lng), level: 3 };
          const mapInstance = new window.kakao.maps.Map(container, options);
          setMap(mapInstance);
          
          // 지도가 로드되면 바로 검색 시작
          if (menu) {
             // 약간의 딜레이를 주어 지도가 완전히 뜬 후 검색 (안전장치)
             setTimeout(() => searchPlaces(mapInstance, menu), 500);
          }
        });
      });
    };
  }, [menu]);

  const searchPlaces = (currentMap: any, keyword: string) => {
    if (!currentMap || !keyword) return;
    setLoading(true);
    
    const ps = new window.kakao.maps.services.Places();
    // 현재 지도 중심 기준 검색
    const center = currentMap.getCenter();
    
    const options = {
      location: center,
      radius: 2000, // 반경 2km
      sort: window.kakao.maps.services.SortBy.DISTANCE,
    };

    ps.keywordSearch(keyword, (data: any, status: any) => {
      setLoading(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setPlaces(data);
        displayMarkers(currentMap, data);
      } else {
        // 검색 결과 없으면 빈 배열
        setPlaces([]);
      }
    }, options);
  };

  const displayMarkers = (currentMap: any, places: any[]) => {
    markers.forEach(m => m.setMap(null));
    const newMarkers: any[] = [];
    const bounds = new window.kakao.maps.LatLngBounds();

    places.forEach((place) => {
      const markerPosition = new window.kakao.maps.LatLng(place.y, place.x);
      const marker = new window.kakao.maps.Marker({ position: markerPosition });
      marker.setMap(currentMap);
      
      window.kakao.maps.event.addListener(marker, 'click', () => {
        window.open(place.place_url, '_blank');
      });

      newMarkers.push(marker);
      bounds.extend(markerPosition);
    });
    
    setMarkers(newMarkers);
    if (places.length > 0) {
      currentMap.setBounds(bounds);
    }
  };

  const handleReSearch = () => {
    if (map && menu) searchPlaces(map, menu);
  };

  return (
    // [수정] 100vh 꽉 채운 후, 내부에서 %로 강제 분할 (가장 안전한 방법)
    <div className="flex flex-col w-full h-screen bg-slate-900 overflow-hidden">
      
      {/* 헤더 */}
      <header className="absolute top-0 left-0 right-0 z-50 p-4 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex justify-between items-center h-14">
         <button onClick={() => router.back()} className="text-slate-400 font-bold px-2 py-1">←</button>
         <h1 className="text-lg font-bold text-white truncate">{menu ? `${menu} 맛집` : '주변 식당'}</h1>
         <div className="w-8"></div>
      </header>

      {/* 1. 지도 영역 (상단 60%) */}
      <div className="relative w-full h-[60%] pt-14"> {/* 헤더 높이만큼 padding */}
        <div id="map" className="w-full h-full"></div>
        
        {/* 다시 검색 버튼 (지도 하단 중앙) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={handleReSearch}
            className="bg-white text-slate-900 px-5 py-2 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 border border-slate-200 active:scale-95 transition-transform"
          >
            <span>🔄</span> 현 위치에서 검색
          </button>
        </div>
      </div>

      {/* 2. 리스트 영역 (하단 40% - 무조건 보임) */}
      <div className="w-full h-[40%] bg-slate-800 border-t border-slate-700 flex flex-col z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
           <span className="text-xs text-slate-400 font-bold">검색 결과 {places.length}건</span>
           {loading && <span className="text-xs text-orange-400 animate-pulse font-bold">찾는 중...</span>}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-10"> {/* 하단 여백 확보 */}
           {places.length === 0 && !loading ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
               <span className="text-2xl">🍃</span>
               <span className="text-xs">이 근처에는 식당이 없네요.<br/>지도를 움직여 다시 검색해보세요!</span>
             </div>
           ) : (
             places.map((place, i) => (
               <div 
                 key={i} 
                 className="p-3 bg-slate-700/50 rounded-xl flex justify-between items-center hover:bg-slate-700 active:bg-slate-600 transition-colors cursor-pointer" 
                 onClick={() => window.open(place.place_url)}
               >
                 <div className="overflow-hidden pr-2">
                   <h3 className="text-sm font-bold text-slate-200 truncate">{place.place_name}</h3>
                   <div className="flex items-center gap-1 mt-1">
                     <span className="text-[10px] text-slate-400 truncate">{place.road_address_name || place.address_name}</span>
                     {place.category_name && <span className="text-[9px] text-slate-500 border border-slate-600 px-1 rounded">{place.category_name.split('>').pop().trim()}</span>}
                   </div>
                 </div>
                 <span className="text-xs font-bold text-orange-400 flex-none whitespace-nowrap">{place.phone || "번호없음"}</span>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantMapPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-white">Loading Map...</div>}>
      <MapContent />
    </Suspense>
  );
}