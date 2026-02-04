import ollama
import json
import random
from datetime import datetime, timedelta, timezone
from weather import get_kma_weather

# [수정] AI에게 '한국어 원어민' 페르소나를 강력하게 주입
SYSTEM_PROMPT = """
당신은 한국인의 입맛을 가장 잘 아는 20년 경력의 미식가입니다.
주어진 시간과 날씨를 고려하여, 한국인이 지금 당장 먹고 싶어할 만한 메뉴 6가지를 추천하세요.

[필수 지침]
1. **반드시 자연스러운 한국어로 대답하세요.** 번역투나 영어 단어(trade, time 등)를 절대 쓰지 마세요.
2. 추천 이유(reason)는 "비가 오니 파전에 막걸리가 생각나네요" 처럼 친구에게 말하듯 따뜻하고 감성적으로 작성하세요.
3. 메뉴 이름은 수식어 없는 명사(예: "김치찌개")로만 적으세요.
4. 응답은 오직 JSON 형식으로만 해야 합니다.

JSON 형식:
{
  "reason": "지금 날씨엔 뜨끈한 국물이 최고죠.",
  "menus": ["칼국수", "김치찌개", "삼겹살", "치킨", "국밥", "떡볶이"],
  "selected_index": 0
}
"""

async def get_menu_recommendation(lat: float, lng: float, current_time: str):
    # 한국 시간 계산 (기존 유지)
    KST = timezone(timedelta(hours=9))
    now_kst = datetime.now(KST)
    real_time_str = now_kst.strftime("%H시 %M분")
    
    # 날씨 조회 (기존 유지)
    weather = get_kma_weather(lat, lng)
    if weather:
        temp = weather.get("T1H", "??")
        pty = int(weather.get("PTY", 0))
        cond = {0:"맑음", 1:"비", 2:"비/눈", 3:"눈", 4:"소나기"}.get(pty, "흐림")
        w_str = f"{cond}, 기온 {temp}도"
    else:
        w_str = "날씨 정보 없음"

    # [수정] 프롬프트를 더 직관적인 한국어 문장으로 변경
    prompt = f"""
    지금 시각은 {real_time_str}이고, 날씨는 {w_str}입니다.
    이 상황에 딱 어울리는 저녁(또는 점심/야식) 메뉴 6개를 골라주세요.
    그리고 그 중에서 가장 추천하는 메뉴 하나를 selected_index(0~5)로 지정해주세요.
    """
    
    try:
        res = ollama.chat(
            model='llama3.1',
            messages=[{'role': 'system', 'content': SYSTEM_PROMPT}, {'role': 'user', 'content': prompt}],
            format='json'
        )
        data = json.loads(res['message']['content'])
        
        # 인덱스 안전장치 (기존 유지)
        if not (0 <= data.get('selected_index', -1) < 6):
            data['selected_index'] = random.randint(0, 5)
            
        return data

    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "reason": "AI가 메뉴를 고르는 중입니다. 잠시만 기다려주세요!",
            "menus": ["김치찌개", "된장찌개", "삼겹살", "치킨", "라면", "비빔밥"],
            "selected_index": 0
        }