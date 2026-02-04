# backend/weather.py
import requests
from datetime import datetime, timedelta
import math

# [본인의 Encoding 인증키를 입력하세요]
KMA_SERVICE_KEY = "5O8amH3CuB7GG9Sao7CcPmOYOwtouzgmUr%2FGSZMR66S%2Fa%2Bm77PktiMeVaixQb1FMZhVgm2%2BcXdn8twiV1lmxzA%3D%3D"

def convert_to_grid(lat, lng):
    # (기존 좌표 변환 로직 그대로 유지)
    RE, GRID = 6371.00877, 5.0
    SLAT1, SLAT2 = 30.0 * math.pi/180, 60.0 * math.pi/180
    OLON, OLAT = 126.0 * math.pi/180, 38.0 * math.pi/180
    XO, YO = 43, 136
    
    # ... (중략: 기존 변환 공식 사용) ...
    # 복잡하면 이전 코드의 convert_to_grid 함수 내용을 그대로 쓰세요
    
    DEGRAD = math.pi / 180.0
    re = RE / GRID
    slat1 = SLAT1
    slat2 = SLAT2
    olon = OLON
    olat = OLAT

    sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(math.pi * 0.25 + slat1 * 0.5)
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
    sf = math.pow(sf, sn) * math.cos(slat1) / sn
    ro = math.tan(math.pi * 0.25 + olat * 0.5)
    ro = re * sf / math.pow(ro, sn)
    ra = math.tan(math.pi * 0.25 + lat * DEGRAD * 0.5)
    ra = re * sf / math.pow(ra, sn)
    theta = lng * DEGRAD - olon
    if theta > math.pi: theta -= 2.0 * math.pi
    if theta < -math.pi: theta += 2.0 * math.pi
    theta *= sn
    nx = math.floor(ra * math.sin(theta) + XO + 0.5)
    ny = math.floor(ro - ra * math.cos(theta) + YO + 0.5)
    return nx, ny

def get_kma_weather(lat, lng):
    nx, ny = convert_to_grid(lat, lng)
    url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
    
    # [수정] 최근 3시간 데이터를 역순으로 조회 (데이터가 나올 때까지 시도)
    for i in range(3):
        try:
            target_time = datetime.now() - timedelta(minutes=40 + (i*60)) # 40분 전, 1시간 40분 전...
            base_date = target_time.strftime("%Y%m%d")
            base_time = target_time.strftime("%H00")

            params = {
                "serviceKey": KMA_SERVICE_KEY,
                "base_date": base_date,
                "base_time": base_time,
                "nx": nx, "ny": ny,
                "dataType": "JSON", "numOfRows": 10
            }
            
            res = requests.get(url, params=params, timeout=3)
            data = res.json()
            
            if data.get('response', {}).get('header', {}).get('resultCode') == '00':
                items = data['response']['body']['items']['item']
                return {item['category']: item['obsrValue'] for item in items}
                
        except Exception as e:
            print(f"Weather API retry {i+1} fail: {e}")
            continue
            
    return None # 3번 다 실패하면 None 반환