# backend/menu.py
import ollama
import json
import random
from weather import get_kma_weather

SYSTEM_PROMPT = """
당신은 20년 경력의 미식가입니다. 
사용자의 현재 상황(시간, 날씨)에 맞는 식사 메뉴 6가지를 추천하고, 그 중 가장 추천하는 메뉴 하나를 선택하세요.

[절대 원칙]
1. 메뉴 이름은 '일반 명사'로만 출력하세요. (예: "얼큰한 짬뽕" -> "짬뽕")
2. 반드시 JSON 형식으로만 응답하세요.

JSON 형식:
{
  "reason": "날씨가 쌀쌀하니 뜨끈한 국물이 좋겠어요.",
  "menus": ["칼국수", "수제비", "김치전", "짬뽕", "우동", "국밥"],
  "selected_index": 3
}
"""

async def get_menu_recommendation(lat: float, lng: float, current_time: str):
    # 1. 날씨 조회
    weather = get_kma_weather(lat, lng)
    if weather:
        temp = weather.get("T1H", "??")
        pty = int(weather.get("PTY", 0))
        cond = {0:"맑음", 1:"비", 2:"비/눈", 3:"눈", 4:"소나기"}.get(pty, "흐림")
        w_str = f"{cond}, 기온 {temp}도"
    else:
        w_str = "날씨 정보 없음"

    # 2. AI 추천 요청
    prompt = f"현재 시간: {current_time}, 날씨: {w_str}. 이 상황에 어울리는 메뉴 6개를 추천하고 베스트 메뉴의 인덱스(0~5)를 selected_index에 넣어줘."
    
    try:
        res = ollama.chat(
            model='llama3.1',
            messages=[{'role': 'system', 'content': SYSTEM_PROMPT}, {'role': 'user', 'content': prompt}],
            format='json'
        )
        data = json.loads(res['message']['content'])
        
        # [안전장치] AI가 인덱스를 잘못 줄 경우를 대비해 범위 체크
        if not (0 <= data.get('selected_index', -1) < 6):
            data['selected_index'] = random.randint(0, 5)
            
        return data

    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "reason": "AI가 잠시 휴식 중입니다. 대신 골라드릴게요!",
            "menus": ["돈까스", "제육볶음", "김치찌개", "비빔밥", "칼국수", "햄버거"],
            "selected_index": 0
        }