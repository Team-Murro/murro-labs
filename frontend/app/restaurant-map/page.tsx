// frontend/app/restaurant-map/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// 지도 컴포넌트 분리 (클라이언트 사이드 렌더링)
function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const menu = searchParams.get('menu');
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 카카오맵 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    // [주의] 본인의 카카오 JS 키를 넣어주세요
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
          
          if (menu) searchPlaces(mapInstance, menu);
        });
      });
    };
  }, [menu]);

  const searchPlaces = (currentMap: any, keyword: string) => {
    if (!currentMap || !keyword) return;
    setLoading(true);
    
    const ps = new window.kakao.maps.services.Places();
    const center = currentMap.getCenter();
    
    const options = {
      location: center,
      radius: 1000,
      sort: window.kakao.maps.services.SortBy.DISTANCE,
    };

    ps.keywordSearch(keyword, (data: any, status: any) => {
      setLoading(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setPlaces(data);
        displayMarkers(currentMap, data);
      } else {
        setPlaces([]); // 결과 없으면 초기화
      }
    }, options);
  };

  const displayMarkers = (currentMap: any, places: any[]) => {
    // 기존 마커 제거
    markers.forEach(m => m.setMap(null));
    const newMarkers: any[] = [];
    
    const bounds = new window.kakao.maps.LatLngBounds();

    places.forEach((place) => {
      const markerPosition = new window.kakao.maps.LatLng(place.y, place.x);
      const marker = new window.kakao.maps.Marker({ position: markerPosition });
      marker.setMap(currentMap);
      
      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        window.open(place.place_url, '_blank');
      });

      newMarkers.push(marker);
      bounds.extend(markerPosition);
    });
    
    setMarkers(newMarkers);
    currentMap.setBounds(bounds);
  };

  const handleReSearch = () => {
    if (map && menu) searchPlaces(map, menu);
  };

  return (
    // [수정] 전체 높이를 100dvh로 고정하여 흔들림 방지
    <div className="flex flex-col h-[100dvh] w-full bg-slate-900 relative">
      
      {/* 헤더 */}
      <header className="flex-none p-4 bg-slate-900/90 backdrop-blur z-20 flex justify-between items-center border-b border-slate-800">
         <button onClick={() => router.back()} className="text-slate-400 font-bold">←</button>
         <h1 className="text-lg font-bold text-white truncate px-4">{menu ? `${menu} 맛집` : '주변 식당'}</h1>
         <div className="w-6"></div>
      </header>

      {/* 지도 영역 (flex-grow로 남은 공간 꽉 채움) */}
      <div className="flex-grow relative w-full overflow-hidden">
        <div id="map" className="w-full h-full"></div>
        
        {/* 이 지역에서 다시 검색 버튼 (지도 위에 절대 위치) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <button 
            onClick={handleReSearch}
            className="bg-white text-slate-900 px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform border border-slate-200"
          >
            <span>🔄</span> 현 지도에서 다시 검색
          </button>
        </div>
      </div>

      {/* 음식점 리스트 (하단 고정, flex-none으로 높이 보호) */}
      <div className="flex-none bg-slate-800 border-t border-slate-700 h-[35vh] flex flex-col z-20">
        <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800">
           <span className="text-xs text-slate-400">검색 결과 {places.length}개</span>
           {loading && <span className="text-xs text-orange-400 animate-pulse">검색 중...</span>}
        </div>
        
        <div className="flex-grow overflow-y-auto p-2 space-y-2">
           {places.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs gap-2">
               <span>텅... 🍃</span>
               <span>지도를 움직여 다시 검색해보세요</span>
             </div>
           ) : (
             places.map((place, i) => (
               <div key={i} className="p-3 bg-slate-700/50 rounded-xl flex justify-between items-center hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => window.open(place.place_url)}>
                 <div className="overflow-hidden">
                   <h3 className="text-sm font-bold text-slate-200 truncate">{place.place_name}</h3>
                   <p className="text-[10px] text-slate-400 truncate mt-0.5">{place.road_address_name || place.address_name}</p>
                 </div>
                 <span className="text-xs font-bold text-orange-400 flex-none ml-2">{place.phone || "번호없음"}</span>
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
    <Suspense fallback={<div className="text-white text-center p-10">Loading Map...</div>}>
      <MapContent />
    </Suspense>
  );
}