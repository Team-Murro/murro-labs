import requests
import json
import os
from weather import get_kma_weather

# [설정] K3s 환경 대응
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434")

async def get_menu_recommendation(lat: float, lng: float, now_str: str):
    condition_desc = "알 수 없음"
    temp = "모름"
    
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
        condition_desc = "맑음"

    # [수정] 룰렛을 위해 6개의 메뉴를 요청하고 하나를 선택하도록 변경
    prompt = f"""
    당신은 점심/저녁 메뉴 추천 전문가입니다.
    
    [상황] 시간: {now_str}, 날씨: {condition_desc}, 기온: {temp}도
    
    [지시사항]
    1. 현재 날씨와 상황에 어울리는 서로 다른 메뉴 6가지를 추천하세요.
    2. 그중 가장 추천하는 메뉴 하나를 선택하세요(0~5번 인덱스 중 하나).
    3. 추천 이유는 자연스러운 한국어로 한 문장 작성하세요.
    
    [출력 형식 - JSON Only]
    {{
        "menus": ["김치찌개", "초밥", "파스타", "삼겹살", "햄버거", "칼국수"],
        "selected_index": 0,
        "reason": "비가 오니 따뜻하고 얼큰한 국물이 생각나는 날씨예요."
    }}
    """

    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "format": "json",
                "stream": False,
                "options": {
                    "temperature": 0.5
                }
            },
            timeout=30
        )
        result_json = response.json()
        return json.loads(result_json['response'])
        
    except Exception as e:
        print(f"Menu AI Error ({OLLAMA_HOST}): {e}")
        # [중요] 에러 시에도 프론트엔드 룰렛이 깨지지 않도록 6개 리스트 반환
        return {
            "menus": ["김치찌개", "된장찌개", "비빔밥", "돈까스", "제육볶음", "우동"],
            "selected_index": 0, 
            "reason": "AI 연결이 지연되어, 한국인의 소울푸드 중에서 골라봤어요."
        }