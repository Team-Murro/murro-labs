# backend/weather.py
import requests
from datetime import datetime, timedelta
import math

# [중요] 여기에 공공데이터포털의 'Decoding Key (일반 인증키 - 디코딩)'를 붙여넣으세요!
# 예: KMA_SERVICE_KEY = "1+2abc..." (끝에 % 기호가 거의 없는 깨끗한 키입니다)
KMA_SERVICE_KEY = "5O8amH3CuB7GG9Sao7CcPmOYOwtouzgmUr/GSZMR66S/a+m77PktiMeVaixQb1FMZhVgm2+cXdn8twiV1lmxzA==" 

def convert_to_grid(lat, lng):
    # (좌표 변환 로직은 기존과 동일하므로 생략하지 않고 그대로 둡니다)
    RE = 6371.00877
    GRID = 5.0
    SLAT1 = 30.0 * math.pi / 180.0
    SLAT2 = 60.0 * math.pi / 180.0
    OLON = 126.0 * math.pi / 180.0
    OLAT = 38.0 * math.pi / 180.0
    XO, YO = 43, 136

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
    
    # 1시간씩 뒤로 가며 데이터 찾기 (최대 3회 시도 - 먹통 방지)
    for i in range(3):
        try:
            target_time = datetime.now() - timedelta(minutes=45 + (i*60))
            base_date = target_time.strftime("%Y%m%d")
            base_time = target_time.strftime("%H00")

            params = {
                "serviceKey": KMA_SERVICE_KEY,  # 디코딩 키를 그대로 사용
                "base_date": base_date,
                "base_time": base_time,
                "nx": nx, "ny": ny,
                "dataType": "JSON", 
                "numOfRows": 10
            }
            
            # 타임아웃 15초 유지 (기상청 서버 느릴 때 대비)
            res = requests.get(url, params=params, timeout=15)
            
            if res.status_code == 200:
                data = res.json()
                if data.get('response', {}).get('header', {}).get('resultCode') == '00':
                    items = data['response']['body']['items']['item']
                    return {item['category']: item['obsrValue'] for item in items}
                    
        except Exception as e:
            print(f"Weather API retry {i+1} fail: {e}")
            continue
            
    return None