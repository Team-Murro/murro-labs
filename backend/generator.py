# backend/generator.py (전체 덮어쓰기)
import requests
import json
import os
import random
import re  # 정규표현식 모듈 추가 (한글 검사용)

# 환경변수 설정
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434") 
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
UNSPLASH_KEY = os.getenv("la_oha92vNk0DjZF4mR25ZgHpNG0N7wiHd033LsaZHg", "")

def get_image_url(keyword):
    """Unsplash 키워드 검색"""
    if not UNSPLASH_KEY:
        seed = random.randint(1, 10000)
        return f"https://picsum.photos/seed/{seed}/600/800"

    # 키워드 정제 (너무 길면 자름)
    safe_keyword = keyword.split(',')[0].strip()
    # 영어가 아니면 강제로 'random' 처리 (Unsplash는 영어만 인식함)
    if re.search('[가-힣]', safe_keyword): 
        safe_keyword = "random"

    url = f"https://api.unsplash.com/search/photos?query={safe_keyword}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        res = requests.get(url, timeout=3)
        data = res.json()
        if data['results']:
            return data['results'][0]['urls']['regular']
    except Exception as e:
        print(f"이미지 검색 실패: {e}")
    
    seed = random.randint(1, 10000)
    return f"https://picsum.photos/seed/{seed}/600/800"

def is_valid_korean(text):
    """한글이 포함되어 있고, 이상한 외계어가 아닌지 검사"""
    # 1. 한글이 적어도 5글자 이상 포함되어야 함
    korean_count = len(re.findall('[가-힣]', text))
    if korean_count < 5:
        return False
    
    # 2. 일본어(히라가나/가타카나)나 아랍어가 섞여 있으면 실패 처리
    # (일본어 유니코드 범위: 3040-309F, 30A0-30FF)
    if re.search('[\u3040-\u30ff\u0600-\u06ff]', text):
        return False
        
    return True

def generate_game_data():
    """Ollama에게 밸런스 게임 생성을 요청 (재시도 로직 포함)"""
    
    # 카테고리를 더 구체적으로 늘려서 중복 확률을 낮춤
    categories = [
        "food taste", "love relationship", "superpower", "money vs time", 
        "survival extreme", "personality mbti", "job career", "friendship",
        "funny situation", "travel vacation"
    ]
    
    # 최대 3번까지 재시도 (이상한 말 하면 다시 시킴)
    for attempt in range(3):
        selected_category = random.choice(categories)
        
        prompt = f"""
        Create a 'Would You Rather' game for Koreans based on: '{selected_category}'.
        
        [RULES]
        1. JSON Format ONLY.
        2. Language: Korean (Questions), English (Image Keywords).
        3. NO "Who am I?" or Meta-questions.
        4. Option A and B must be conflicting choices.
        
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
            "model": "llama3.1",
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.85,    # 창의성 (높을수록 다양함)
                "top_p": 0.9,           # 엉뚱한 단어 자르기
                "repeat_penalty": 1.2   # [중요] 했던 말 또 하기 방지
            }
        }
        
        try:
            print(f"🤖 AI 생성 시도 ({attempt+1}/3) - 주제: {selected_category}...")
            res = requests.post(OLLAMA_URL, json=payload, timeout=40)
            result = res.json()
            
            if "error" in result:
                continue

            # 응답 파싱
            content_str = result['response']
            
            # [검열 1단계] JSON 변환 가능한지
            try:
                content = json.loads(content_str)
            except:
                print("❌ JSON 형식이 깨짐. 재시도.")
                continue

            # [검열 2단계] 한글이 제대로 포함되었는지 + 일본어/아랍어 없는지
            combined_text = content.get('question', '') + content.get('option_a', '') + content.get('option_b', '')
            if not is_valid_korean(combined_text):
                print(f"❌ 언어 오류 감지 (외계어 또는 한글 부족): {combined_text[:20]}...")
                continue # 다시 뽑기!

            # 여기까지 통과했으면 합격!
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
            print(f"❌ 생성 에러: {e}")
            continue # 에러 나도 다음 시도로 넘어감
            
    print("🚨 3번 시도 모두 실패. AI 상태를 확인하세요.")
    return None