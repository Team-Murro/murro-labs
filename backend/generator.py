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
    """자연스러운 한국어 패치 완료된 생성기"""
    
    themes = ["음식 취향", "초능력", "연애/결혼", "극한 상황", "성격 테스트", "직장 생활"]
    selected_theme = random.choice(themes)

    # [핵심 변경] 페르소나 변경: '번역기' -> '한국인 친구'
    # '매사적' 같은 없는 단어 쓰지 말라고(Common words) 강력 지시
    prompt = f"""
    You are a witty Korean friend creating a 'Balance Game' (Would You Rather).
    Topic: {selected_theme}

    [CRITICAL INSTRUCTIONS]
    1. Language: Use 100% Natural, Casual Korean (반말). 
    2. NO Translation style (Don't say "당신은~"). Speak like a friend.
    3. Length: Question under 15 chars. Options under 8 chars.
    4. Vocabulary: Use ONLY common, daily words. Do NOT use complex or made-up words.

    [Bad Examples - DO NOT DO THIS]
    - Q: 당신은 마법을 부릴 수 있다면 무엇을 하시겠습니까? (Too formal/long)
    - A: 타인의 마음을 읽는 독심술 (Too descriptive)
    
    [Good Examples - DO THIS]
    - Q: 평생 한 가지만 먹기?
    - A: 평생 라면
    - B: 평생 탄산
    
    - Q: 다시 태어난다면?
    - A: 100조 부자
    - B: 아이큐 200 천재

    [Output JSON Format]
    {{
        "question": "짧은 질문 (예: 평생 솔로 vs 평생 환승이별?)",
        "option_a": "짧은 A (예: 평생 솔로)",
        "keyword_a": "lonely man",
        "option_b": "짧은 B (예: 환승이별 당하기)",
        "keyword_b": "crying woman"
    }}

    Generate JSON only.
    """
    
    payload = {
        "model": "llama3.1",
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.8,    # 적당한 창의성
            "top_p": 0.9,
            "presence_penalty": 0.6 # 반복 억제
        }
    }
    
    try:
        res = requests.post(OLLAMA_URL, json=payload, timeout=12) # 타임아웃 약간 늘림
        result = res.json()
        
        if "response" not in result: return None
        
        content = json.loads(result['response'])
        
        # 이미지 매칭
        content['img_a'] = get_image_url(content.get('keyword_a', 'object'))
        content['img_b'] = get_image_url(content.get('keyword_b', 'object'))
        
        content.pop('keyword_a', None)
        content.pop('keyword_b', None)
        
        return content

    except Exception as e:
        print(f"AI 생성 에러: {e}")
        return None