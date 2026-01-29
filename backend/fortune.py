# backend/fortune.py
import ollama
import json
import random
from datetime import datetime

# 시스템 프롬프트 강화: 한국어 강제 및 다국어 사용 금지
SYSTEM_PROMPT = """
당신은 30년 경력의 용한 사주명리학자 '머로도사'입니다. 
사용자의 '생년월일', '태어난 시간', '성별'을 바탕으로 오늘의 운세를 풀이합니다.

[절대 원칙]
1. **무조건 한국어(Korean)로만 작성하세요.** (영어, 이탈리아어 금지)
2. 말투는 "~~하는구려", "~~할 게야", "조심하게나" 같은 노인 도사 말투를 유지하세요.
3. 운세 내용은 최소 5문장 이상으로 길고 풍성하게 작성하세요.
4. 답변은 오직 **JSON 데이터만** 출력하세요.

반드시 아래 JSON 형식을 지키세요:
{
  "total_score": 90,
  "comment": "자네는 오늘 하늘의 기운이 머리 위로 쏟아지는 형국이네. (한국어로 길게 작성)",
  "lucky_numbers": [3, 12, 25, 33, 41, 44],
  "lucky_color": "황금색",
  "wealth_luck": "⭐⭐⭐⭐⭐"
}
"""

async def get_fortune_reading(birth_date: str, birth_time: str, gender: str):
    today = datetime.now().strftime("%Y년 %m월 %d일")
    time_str = birth_time if birth_time else "시간 모름"

    user_prompt = f"""
    [명령] 오늘 날짜: {today}
    사용자: {birth_date}생, 시간: {time_str}, 성별: {gender}
    
    이 사람의 오늘 운세를 한국어로 아주 자세하게 봐주게. 다른 언어는 절대 섞지 말게.
    """

    try:
        response = ollama.chat(
            model='llama3.1',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_prompt},
            ],
            format='json',
            options={'temperature': 0.6} # 0.8 -> 0.6으로 낮춤 (안정성 강화)
        )
        
        content = response['message']['content']
        result = json.loads(content)
        
        # 번호 검증 로직
        nums = result.get('lucky_numbers', [])
        if len(nums) != 6 or not all( isinstance(n, int) and 1 <= n <= 45 for n in nums):
            result['lucky_numbers'] = sorted(random.sample(range(1, 46), 6))
            
        return result
        
    except Exception as e:
        print(f"⚠️ 운세 생성 에러: {e}")
        return {
            "total_score": 60,
            "comment": "오늘은 기가 흐릿하여 점괘가 잘 보이지 않는구려. 잠시 후 다시 시도하게나.",
            "lucky_numbers": sorted(random.sample(range(1, 46), 6)),
            "lucky_color": "회색",
            "wealth_luck": "⭐⭐"
        }
