import requests
import json
# [수정] weather.py에 정의된 정확한 함수명 'get_kma_weather'를 가져옵니다.
from weather import get_kma_weather

async def get_menu_recommendation(lat: float, lng: float, now_str: str):
    # 1. 날씨 데이터 가져오기 (기상청 Raw Data)
    # 반환값 예시: {'PTY': '0', 'T1H': '20.5', 'REH': '50', ...}
    weather_data = get_kma_weather(lat, lng)
    
    # 기본값 설정
    condition_desc = "알 수 없음"
    temp = "모름"
    
    # 2. 기상청 데이터를 사람이 읽을 수 있는 텍스트로 변환
    if weather_data:
        try:
            # PTY(강수형태): 0=없음, 1=비, 2=비/눈, 3=눈, 4=소나기
            pty = int(weather_data.get('PTY', 0))
            
            if pty == 0:
                condition_desc = "맑음 (비 안 옴)"
            elif pty in [1, 2, 4]:
                condition_desc = "비"
            elif pty == 3:
                condition_desc = "눈"
                
            temp = weather_data.get('T1H', '모름')
        except Exception as e:
            print(f"Weather parse error: {e}")
            pass
            
    # 3. 프롬프트 작성 (명확한 날씨 정보 전달)
    prompt = f"""
    당신은 센스 있는 점심/저녁 메뉴 추천 전문가입니다.
    
    [현재 환경]
    - 시간: {now_str}
    - 날씨: {condition_desc} 
    - 기온: {temp}도
    
    [규칙]
    1. 날씨가 '비'나 '눈'일 때는 파전, 막걸리, 따뜻한 국물 요리 등을 추천하세요.
    2. 날씨가 '맑음'이라면 비 오는 날 먹는 음식(전, 막걸리)은 절대 추천하지 마세요. 깔끔한 한식이나 양식을 추천하세요.
    3. 추천 메뉴는 딱 하나만 선정하고, 그 이유를 날씨와 연관 지어 한 문장으로 설명하세요.
    
    [출력 형식 - JSON Only]
    {{
        "menu_name": "음식 이름 (한글)",
        "reason": "추천 이유 (한 문장)"
    }}
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1", # 혹은 사용 중인 모델명 (예: 'llama3')
                "prompt": prompt,
                "format": "json",
                "stream": False
            }
        )
        result_json = response.json()
        return json.loads(result_json['response'])
        
    except Exception as e:
        print(f"Menu Error: {e}")
        # 에러 시 안전한 기본값
        return {"menu_name": "김치찌개", "reason": "날씨 정보를 불러오지 못해 한국인의 소울푸드를 추천합니다."}