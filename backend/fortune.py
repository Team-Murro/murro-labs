import requests
import json
import random

# [핵심] Ollama가 날짜를 헷갈리지 않게 한글로 못 박는 함수
def format_korean_date(date_str):
    try:
        parts = date_str.split('-')
        if len(parts) == 3:
            return f"{parts[0]}년 {parts[1]}월 {parts[2]}일"
        return date_str
    except:
        return date_str

# main.py에서 이 함수를 호출합니다. (이름 유지)
async def get_fortune_reading(birth_date: str, birth_time: str, gender: str):
    korean_date = format_korean_date(birth_date)
    
    # 프롬프트: 날짜 절대 변경 금지 및 한글 강제
    prompt = f"""
    당신은 전문적인 사주팔자 상담사입니다.
    
    [사용자 정보]
    - 생년월일: {korean_date} (이 날짜를 절대 변경하지 마세요. 사용자는 {korean_date}에 태어났습니다.)
    - 성별: {gender}
    - 태어난 시간: {birth_time}
    
    [지시사항]
    위 사용자의 오늘 운세를 한국어로만 작성하세요. 
    엉뚱한 날짜로 해석하지 말고 반드시 입력된 생년월일을 기준으로 하세요.
    
    [출력 형식 - JSON Only]
    {{
        "wealth_luck": "금전운 점수 (0~100)",
        "total_score": "총점 (0~100)",
        "lucky_color": "행운의 색상 (영어)",
        "lucky_numbers": [숫자1, 숫자2, 숫자3, 숫자4, 숫자5, 숫자6],
        "comment": "상세 풀이 (존댓말, 5문장 이상, {korean_date}생임을 명시)"
    }}
    """

    try:
        # requests로 호출하여 JSON 포맷 강제
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1", # 사용하시는 모델명에 맞춰 llama3.1로 설정
                "prompt": prompt,
                "format": "json",
                "stream": False
            }
        )
        
        result_json = response.json()
        data = json.loads(result_json['response'])
        
        # 혹시 모를 번호 누락 방지 (안전장치)
        if 'lucky_numbers' not in data or not isinstance(data['lucky_numbers'], list):
            data['lucky_numbers'] = sorted(random.sample(range(1, 46), 6))
            
        return data

    except Exception as e:
        print(f"Fortune Error: {e}")
        # 에러 발생 시 프론트엔드가 죽지 않게 기본값 반환
        return {
            "wealth_luck": 80,
            "total_score": 85,
            "lucky_color": "Gold",
            "lucky_numbers": sorted(random.sample(range(1, 46), 6)),
            "comment": "죄송합니다. 도사님이 잠시 명상에 잠기셨습니다. (AI 응답 시간 초과 혹은 오류)"
        }