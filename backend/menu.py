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

    # [수정] 프롬프트 대폭 단순화 (영어 지시문 + 한국어 예시)
    # 복잡한 페르소나를 제거하고 '데이터 생성'에 집중시킵니다.
    prompt = f"""
    Context:
    - Time: {now_str}
    - Weather: {condition_desc}
    - Temperature: {temp}

    Task:
    1. Provide 6 distinct lunch/dinner menu names in Korean.
    2. Select one best menu index (0-5).
    3. Write a short reason in Korean (one sentence).

    Format: JSON ONLY.
    
    Example:
    {{
      "menus": ["김치찌개", "돈까스", "초밥", "삼겹살", "비빔밥", "우동"],
      "selected_index": 0,
      "reason": "비가 오는 날에는 따뜻하고 얼큰한 김치찌개가 최고입니다."
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
                    "temperature": 0.2, # [중요] 창의성을 낮춰서 헛소리 방지 (0.5 -> 0.2)
                    "top_p": 0.9,
                    "repeat_penalty": 1.1 # 반복 억제
                }
            },
            timeout=30
        )
        
        result_json = response.json()
        data = json.loads(result_json['response'])
        
        # [안전장치] 이유가 너무 짧거나 이상하면 강제 수정
        if len(data.get('reason', '')) < 5:
            data['reason'] = f"지금 날씨({condition_desc})에 딱 어울리는 메뉴예요!"
            
        return data
        
    except Exception as e:
        print(f"Menu AI Error ({OLLAMA_HOST}): {e}")
        # 비상용 기본값
        return {
            "menus": ["김치찌개", "된장찌개", "비빔밥", "돈까스", "제육볶음", "우동"],
            "selected_index": 0, 
            "reason": "AI가 잠시 휴식 중이라, 호불호 없는 메뉴를 골라봤어요."
        }