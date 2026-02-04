import requests
import json
import os
from weather import get_kma_weather

# [설정] K3s 환경 대응
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434")

async def get_menu_recommendation(lat: float, lng: float, now_str: str):
    # 기본값 미리 설정 (에러나도 이거라도 나가게)
    condition_desc = "알 수 없음"
    temp = "모름"
    
    # 1. 날씨 조회 (실패해도 죽지 않게 처리)
    try:
        weather_data = get_kma_weather(lat, lng)
        if weather_data:
            pty = int(weather_data.get('PTY', 0))
            if pty == 0: condition_desc = "맑음"
            elif pty in [1, 2, 4]: condition_desc = "비"
            elif pty == 3: condition_desc = "눈"
            temp = weather_data.get('T1H', '모름')
    except Exception as e:
        print(f"Weather API Error: {e}")
        # 날씨 에러나면 그냥 '맑음' 가정하고 진행
        condition_desc = "맑음"

    # 2. 메뉴 추천 요청
    prompt = f"""
    당신은 한국의 점심/저녁 메뉴 추천 전문가입니다.
    
    [상황] 시간: {now_str}, 날씨: {condition_desc}, 기온: {temp}도
    
    [지시사항]
    1. 날씨가 '비'면 파전/국물, '맑음'이면 깔끔한 한식/일식/양식을 추천하세요.
    2. 추천 메뉴는 딱 1개만 정하세요.
    3. 이유는 날씨와 엮어서 자연스럽게 한 문장으로 쓰세요.
    
    [출력 형식 - JSON Only]
    {{
        "menu_name": "음식명",
        "reason": "추천 이유"
    }}
    """

    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "format": "json",
                "stream": False
            },
            timeout=30 # 30초 안에 응답 없으면 끊고 기본값
        )
        result_json = response.json()
        return json.loads(result_json['response'])
        
    except Exception as e:
        print(f"Menu AI Error ({OLLAMA_HOST}): {e}")
        # [중요] 에러 발생 시 프론트가 죽지 않도록 '무난한 메뉴' 리턴
        return {
            "menu_name": "김치찌개", 
            "reason": "AI 연결이 지연되어, 한국인의 소울푸드를 추천해 드립니다."
        }