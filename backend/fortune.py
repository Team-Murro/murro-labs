import requests
import json
import random

# [핵심] 날짜 포맷을 한글로 고정하는 함수
def format_korean_date(date_str):
    try:
        parts = date_str.split('-')
        if len(parts) == 3:
            return f"{parts[0]}년 {parts[1]}월 {parts[2]}일"
        return date_str
    except:
        return date_str

async def get_fortune_reading(birth_date: str, birth_time: str, gender: str):
    # 날짜 변환 (예: 2026-02-07 -> 2026년 02월 07일)
    korean_date = format_korean_date(birth_date)
    
    prompt = f"""
    당신은 전문적인 사주팔자 상담사입니다.
    
    [사용자 정보]
    - 생년월일: {korean_date} (반드시 이 날짜 그대로 해석하세요. 날짜를 마음대로 바꾸지 마세요.)
    - 성별: {gender}
    - 태어난 시간: {birth_time}
    
    [지시사항]
    위 사용자의 오늘 운세를 한국어로만 작성하세요. 
    입력된 생년월일({korean_date})을 명시하며 풀이하세요.
    
    [출력 형식 - JSON Only]
    {{
        "wealth_luck": "금전운 점수 (0~100)",
        "total_score": "총점 (0~100)",
        "lucky_color": "행운의 색상 (한글)",
        "lucky_numbers": [숫자1, 숫자2, 숫자3, 숫자4, 숫자5, 숫자6],
        "comment": "상세 풀이 (존댓말, 5문장 이상)"
    }}
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "format": "json",
                "stream": False
            }
        )
        
        result_json = response.json()
        data = json.loads(result_json['response'])
        
        # 번호 리스트 검증
        if 'lucky_numbers' not in data or not isinstance(data['lucky_numbers'], list):
            data['lucky_numbers'] = sorted(random.sample(range(1, 46), 6))
            
        return data

    except Exception as e:
        print(f"Fortune Error: {e}")
        return {
            "wealth_luck": 80,
            "total_score": 85,
            "lucky_color": "황금색",
            "lucky_numbers": sorted(random.sample(range(1, 46), 6)),
            "comment": "도사님이 잠시 자리를 비우셨습니다. (AI 응답 오류)"
        }