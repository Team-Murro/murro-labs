import requests
import json
import os
import random
import re

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434") 
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
UNSPLASH_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")

def get_image_url(keyword):
    """Unsplash 키워드 기반 이미지 검색 (실패 시 랜덤 이미지)"""
    if not UNSPLASH_KEY:
        seed = random.randint(1, 99999)
        return f"https://picsum.photos/seed/{seed}/600/800"

    # 키워드 정제
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
    """핵심만 찌르는 간결한 밸런스 게임 생성기"""
    
    # 주제를 넓게 주되, 일상적이고 직관적인 것 위주로
    topic_hints = [
        "음식 (평생 먹기)", "초능력", "돈 vs 명예", 
        "최악의 상황 (무인도/좀비)", "연애/결혼", "직장 생활"
    ]
    selected_hint = random.choice(topic_hints)

    # [핵심] 프롬프트를 '짧고 굵게'로 전면 수정
    prompt = f"""
    You are a 'Balance Game' master in Korea.
    Create a Short, Punchy, and Addictive "Would You Rather" question.
    Topic Hint: {selected_hint}

    [STRICT RULES - KEEP IT SIMPLE]
    1. Question must be a short scenario (Max 15 words).
    2. Options A and B must be extremely short (1~5 words).
    3. Use Casual Korean (반말). 
    4. NO explanations. Just the question and options.

    [Good Examples]
    - Q: "평생 한 가지만 먹어야 한다면?" / A: "라면" / B: "치킨"
    - Q: "다시 태어난다면?" / A: "존잘 거지" / B: "평범한 재벌"
    - Q: "100% 확률로?" / A: "1억 받기" / B: "50%로 100억"

    [JSON Format]
    {{
        "question": "짧은 질문 (예: 평생 딱 하나만?)"
        "option_a": "짧은 선택지 A (예: 짜장면)",
        "keyword_a": "Simple English keyword for A (e.g. noodles)",
        "option_b": "짧은 선택지 B (예: 짬뽕)",
        "keyword_b": "Simple English keyword for B (e.g. spicy soup)"
    }}
    
    Generate JSON only.
    """
    
    payload = {
        "model": "llama3.1",
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.85,   # 창의성은 유지하되
            "top_p": 0.9,
            "max_tokens": 150      # 생성을 짧게 제한
        }
    }
    
    try:
        # 타임아웃을 조금 넉넉히 (AI가 생각을 빨리 끝내도록 유도했으므로 실제 응답은 빠름)
        res = requests.post(OLLAMA_URL, json=payload, timeout=20)
        result = res.json()
        
        if "response" not in result: return None
        
        content = json.loads(result['response'])
        
        # 이미지 URL 생성
        content['img_a'] = get_image_url(content.get('keyword_a', 'object'))
        content['img_b'] = get_image_url(content.get('keyword_b', 'object'))
        
        # 불필요한 키 삭제 (DB 에러 방지)
        content.pop('keyword_a', None)
        content.pop('keyword_b', None)
        
        return content

    except Exception as e:
        print(f"AI 생성 에러: {e}")
        return None