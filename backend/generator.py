import requests
import json
import os
import random
import re

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434") 
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
UNSPLASH_KEY = os.getenv("la_oha92vNk0DjZF4mR25ZgHpNG0N7wiHd033LsaZHg", "")

def get_image_url(keyword):
    """이미지 검색 로직 (기존 유지)"""
    if not UNSPLASH_KEY:
        seed = random.randint(1, 99999)
        return f"https://picsum.photos/seed/{seed}/600/800"

    safe_keyword = keyword.split(',')[0].strip()
    if re.search('[가-힣]', safe_keyword): 
        safe_keyword = "concept"

    url = f"https://api.unsplash.com/search/photos?query={safe_keyword}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        res = requests.get(url, timeout=3)
        data = res.json()
        if data['results']:
            return data['results'][0]['urls']['regular']
    except Exception:
        pass
    
    seed = random.randint(1, 99999)
    return f"https://picsum.photos/seed/{seed}/600/800"

def generate_game_data():
    """창의성보다는 '안정성'과 '짧은 길이'에 올인한 생성기"""
    
    # 주제를 더 구체적이고 일상적인 것으로 한정 (추상적인 주제 제거)
    themes = [
        "음식 취향 (Food)", 
        "연애와 결혼 (Dating)", 
        "돈과 성공 (Money)", 
        "직장 생활 (Work)", 
        "초능력 (Superpower)"
    ]
    
    # [안전장치] AI가 이상한 답을 내놓으면 최대 3번까지 다시 시도
    for attempt in range(3):
        selected_theme = random.choice(themes)

        # [핵심] Few-Shot Prompting: 잘된 예시를 직접 보여줌으로써 패턴을 강제함
        prompt = f"""
        Role: You are a Korean Balance Game generator.
        Task: Create one simple "Would You Rather" question based on the theme: "{selected_theme}".
        
        [STRICT RULES]
        1. Language: Natural Korean (반말). No translation tone.
        2. Length: Question must be UNDER 15 characters. Options must be UNDER 6 characters.
        3. Logic: Option A and B must be opposite or conflicting.
        4. Vocabulary: Use elementary school level words. No difficult words.

        [PERFECT EXAMPLES - FOLLOW THIS FORMAT]
        Example 1:
        {{
            "question": "평생 한 가지만 먹는다면?",
            "option_a": "평생 라면",
            "keyword_a": "ramen",
            "option_b": "평생 카레",
            "keyword_b": "curry"
        }}

        Example 2:
        {{
            "question": "다시 태어난다면?",
            "option_a": "재벌 2세",
            "keyword_a": "money",
            "option_b": "천재 과학자",
            "keyword_b": "scientist"
        }}

        Example 3:
        {{
            "question": "더 고통스러운 상황은?",
            "option_a": "이별 통보",
            "keyword_a": "breakup",
            "option_b": "고백 거절",
            "keyword_b": "rejected"
        }}

        Now, generate a NEW one in JSON format only.
        """
        
        payload = {
            "model": "llama3.1",
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.4,    # [중요] 0.8 -> 0.4 (환각 방지, 논리력 강화)
                "top_p": 0.9,
                "max_tokens": 120      # 답변 길이 물리적 제한
            }
        }
        
        try:
            res = requests.post(OLLAMA_URL, json=payload, timeout=10)
            result = res.json()
            
            if "response" not in result: continue
            
            content = json.loads(result['response'])
            
            # [Python 검증 로직] AI를 믿지 말고 직접 검사
            q_len = len(content.get('question', ''))
            a_len = len(content.get('option_a', ''))
            b_len = len(content.get('option_b', ''))
            
            # 1. 길이가 너무 길면 실패 처리 -> 재시도
            if q_len > 20 or a_len > 10 or b_len > 10:
                print(f"⚠️ 길이 초과로 재생성 시도 ({attempt+1}/3): Q({q_len}) A({a_len}) B({b_len})")
                continue
                
            # 2. 질문에 물음표가 없으면 추가
            if not content['question'].endswith('?'):
                content['question'] += '?'

            # 이미지 URL 매칭
            content['img_a'] = get_image_url(content.get('keyword_a', 'object'))
            content['img_b'] = get_image_url(content.get('keyword_b', 'object'))
            
            # 정리 및 반환
            content.pop('keyword_a', None)
            content.pop('keyword_b', None)
            
            return content

        except Exception as e:
            print(f"AI 생성 에러 ({attempt+1}/3): {e}")
            continue
            
    # 3번 다 실패했을 경우의 비상용 하드코딩 데이터 (에러 방지)
    return {
        "question": "AI가 잠시 쉬고 있어요",
        "option_a": "기다리기",
        "img_a": "https://picsum.photos/600/800",
        "option_b": "새로고침",
        "img_b": "https://picsum.photos/600/801"
    }