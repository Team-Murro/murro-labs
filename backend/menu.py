import requests
import json
import os
import random  # [추가] 랜덤 추첨을 위해 import
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

    # [수정] 구체적인 메뉴 언급 금지 & 6개 후보 생성 요청
    prompt = f"""
    Context:
    - Time: {now_str}
    - Weather: {condition_desc}
    - Temperature: {temp}

    Task:
    1. Provide 6 distinct lunch/dinner menu names suitable for the current weather/time.
    2. Write a short recommendation reason in Korean (one sentence).
    
    [IMPORTANT constraints for 'reason']:
    - You must describe the **vibe** or **category** (e.g., spicy, warm soup, light, greasy) that fits the weather.
    - **NEVER** mention specific food names in the reason. (e.g., Do NOT say "I recommend Kimchi Stew".)
    
    Format: JSON ONLY.
    
    Example:
    {{
      "menus": ["김치찌개", "우동", "삼겹살", "비빔밥", "파스타", "햄버거"],
      "reason": "비가 추적추적 내리는 날에는 몸을 녹여줄 따뜻한 국물 요리가 제격이에요." 
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
                    "temperature": 0.3, 
                    "top_p": 0.9
                }
            },
            timeout=30
        )
        
        result_json = response.json()
        data = json.loads(result_json['response'])
        
        # [핵심 수정] AI가 고른 인덱스는 무시하고, 파이썬에서 '진짜 랜덤'으로 결정
        if 'menus' in data and isinstance(data['menus'], list) and len(data['menus']) > 0:
            # 메뉴가 6개가 안 올 수도 있으니 길이 기반으로 랜덤 산출
            data['selected_index'] = random.randint(0, len(data['menus']) - 1)
        else:
            # 만약 메뉴 리스트가 깨져서 오면 비상용 리스트 사용
            data['menus'] = ["김치찌개", "된장찌개", "비빔밥", "돈까스", "제육볶음", "우동"]
            data['selected_index'] = random.randint(0, 5)

        # 이유가 비어있거나 너무 짧으면 기본 멘트
        if len(data.get('reason', '')) < 5:
            data['reason'] = f"지금 날씨({condition_desc})에 딱 어울리는 메뉴들로 골라봤어요!"
            
        return data
        
    except Exception as e:
        print(f"Menu AI Error ({OLLAMA_HOST}): {e}")
        # 에러 시에도 랜덤으로 돌려서 반환
        return {
            "menus": ["김치찌개", "된장찌개", "비빔밥", "돈까스", "제육볶음", "우동"],
            "selected_index": random.randint(0, 5), 
            "reason": "AI가 잠시 쉬고 있어서, 한국인의 소울푸드 중에서 랜덤으로 추천해 드릴게요."
        }