# backend/weather.py
import requests
from datetime import datetime, timedelta
import math

# [본인의 Encoding 인증키를 입력하세요]
KMA_SERVICE_KEY = "5O8amH3CuB7GG9Sao7CcPmOYOwtouzgmUr%2FGSZMR66S%2Fa%2Bm77PktiMeVaixQb1FMZhVgm2%2BcXdn8twiV1lmxzA%3D%3D"

def convert_to_grid(lat, lng):
    """위경도를 기상청 격자 좌표(NX, NY)로 변환"""
    RE = 6371.00877
    GRID = 5.0
    SLAT1 = 30.0 * (math.pi / 180.0)
    SLAT2 = 60.0 * (math.pi / 180.0)
    OLON = 126.0 * (math.pi / 180.0)
    OLAT = 38.0 * (math.pi / 180.0)
    XO, YO = 43, 136

    sn = math.tan(math.pi * 0.25 + SLAT2 * 0.5) / math.tan(math.pi * 0.25 + SLAT1 * 0.5)
    sn = math.log(math.cos(SLAT1) / math.cos(SLAT2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + SLAT1 * 0.5)
    sf = (math.pow(sf, sn) * math.cos(SLAT1)) / sn
    ro = math.tan(math.pi * 0.25 + OLAT * 0.5)
    ro = (RE / GRID) * sf / math.pow(ro, sn)

    ra = math.tan(math.pi * 0.25 + (lat * (math.pi / 180.0)) * 0.5)
    ra = (RE / GRID) * sf / math.pow(ra, sn)
    theta = lng * (math.pi / 180.0) - OLON
    if theta > math.pi: theta -= 2.0 * math.pi
    if theta < -math.pi: theta += 2.0 * math.pi
    theta *= sn

    nx = math.floor(ra * math.sin(theta) + XO + 0.5)
    ny = math.floor(ro - ra * math.cos(theta) + YO + 0.5)
    return nx, ny

def get_kma_weather(lat, lng):
    """기상청 초단기실황 API 호출"""
    nx, ny = convert_to_grid(lat, lng)
    url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
    
    # 기상청은 매시 40분에 데이터가 생성됨 (안전하게 현재 시간 기준 45분 전 데이터 조회)
    base_datetime = datetime.now() - timedelta(minutes=45)
    base_date = base_datetime.strftime("%Y%m%d")
    base_time = base_datetime.strftime("%H00")

    params = {
        "serviceKey": KMA_SERVICE_KEY,
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx, "ny": ny,
        "dataType": "JSON", "numOfRows": 10
    }
    
    try:
        res = requests.get(url, params=params, timeout=5)
        data = res.json()
        if data['response']['header']['resultCode'] == '00':
            items = data['response']['body']['items']['item']
            # T1H(기온), PTY(강수형태), REH(습도)
            return {item['category']: item['obsrValue'] for item in items}
    except Exception as e:
        print(f"Weather API Error: {e}")
    return None