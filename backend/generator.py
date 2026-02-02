import requests
import json
import os
import random

# 환경변수 설정
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434") 
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
UNSPLASH_KEY = os.getenv("la_oha92vNk0DjZF4mR25ZgHpNG0N7wiHd033LsaZHg", "")

def get_image_url(keyword):
    """Unsplash 키워드 검색 (없으면 랜덤)"""
    if not UNSPLASH_KEY:
        seed = random.randint(1, 1000)
        return f"https://picsum.photos/seed/{seed}/600/800"

    # 키워드가 너무 길면 잘라냄 (검색 정확도 향상)
    safe_keyword = keyword.split(',')[0].strip()
    url = f"https://api.unsplash.com/search/photos?query={safe_keyword}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        res = requests.get(url, timeout=3)
        data = res.json()
        if data['results']:
            return data['results'][0]['urls']['regular']
    except Exception as e:
        print(f"이미지 검색 실패: {e}")
    
    seed = random.randint(1, 1000)
    return f"https://picsum.photos/seed/{seed}/600/800"

def generate_game_data():
    """Ollama에게 고퀄리티 밸런스 게임 생성 요청"""
    
    # 랜덤 카테고리로 다양성 확보
    categories = ["romance/dating", "superpower", "food", "wealth/money", "extreme situation", "personality"]
    selected_category = random.choice(categories)

    prompt = f"""
    You are a creative game master for a 'Would You Rather' game (Balance Game).
    Create a fun, difficult, and engaging scenario for Koreans based on the category: '{selected_category}'.

    [STRICT RULES]
    1. NEVER ask "Who am I?" or trivia quizzes.
    2. Questions must be "Option A vs Option B".
    3. Output MUST be valid JSON only.
    4. Language: Korean (Question/Options), English (Keywords).
    5. Keywords must be VISUAL descriptions for image search (e.g., not "sad", but "crying man face").

    [EXAMPLES]
    - Bad: "내 이름은?", "한국의 수도는?"
    - Good: 
      {{
        "question": "평생 한 가지 음식만 먹어야 한다면?",
        "option_a": "매일 라면만 먹기",
        "keyword_a": "delicious spicy ramen noodles close up",
        "option_b": "매일 햄버거만 먹기",
        "keyword_b": "juicy cheeseburger close up"
      }}

    [Generate Now]
    Format:
    {{
        "question": "Korean Question",
        "option_a": "Korean Option A",
        "keyword_a": "English Visual Keyword for A",
        "option_b": "Korean Option B",
        "keyword_b": "English Visual Keyword for B"
    }}
    """
    
    payload = {
        "model": "llama3.1", # 모델명 확인
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.8  # 창의성 높임
        }
    }
    
    try:
        print(f"🤖 AI 아이디어 생성 중 (주제: {selected_category})...")
        res = requests.post(OLLAMA_URL, json=payload, timeout=40)
        result = res.json()
        
        if "error" in result:
            print(f"❌ Ollama Error: {result['error']}")
            return None
            
        content = json.loads(result['response'])
        
        # 이미지 검색
        img_a = get_image_url(content.get('keyword_a', 'random'))
        img_b = get_image_url(content.get('keyword_b', 'random'))
        
        return {
            "question": content['question'],
            "option_a": content['option_a'],
            "img_a": img_a,
            "option_b": content['option_b'],
            "img_b": img_b
        }
    except Exception as e:
        print(f"❌ 생성 실패: {e}")
        return None