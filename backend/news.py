import feedparser
import requests
import json
import os
import re

# [설정] K3s 환경 대응
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434")

# 대한민국 주요 뉴스 (Top Stories)
RSS_URL = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"

async def get_ai_news_briefing():
    # 1. RSS 파싱 (최신 10개 가져오기)
    original_articles = []
    try:
        feed = feedparser.parse(RSS_URL)
        entries = feed.entries[:10]  # 10개 확보
        
        news_context = ""
        for i, entry in enumerate(entries):
            title = entry.title
            if ' - ' in title:
                title = title.split(' - ')[0]
            
            original_articles.append({"title": title, "link": entry.link})
            news_context += f"[{i}] {title}\n"
            
    except Exception as e:
        print(f"RSS Parsing Error: {e}")
        return {"items": [{"summary": "뉴스 데이터를 가져올 수 없습니다.", "link": "#"}]}

    # 2. Ollama에게 10개 전체 요약 요청
    # [수정] Select 3 -> Summarize ALL items
    prompt = f"""
    Context (News Headlines with IDs):
    {news_context}

    Task:
    Summarize ALL listed news items (from ID 0 to {len(entries)-1}) into short Korean sentences.

    Guidelines:
    1. Length: Under 60 characters per summary.
    2. Tone: Professional newscaster style.
    3. Return original ID for linking.

    Format: JSON List of Objects
    Example:
    [
        {{ "id": 0, "summary": "코스피, 외인 매도세에 2500선 턱걸이 마감" }},
        {{ "id": 1, "summary": "삼성전자, 갤럭시 S25 AI 기능 대폭 강화" }}
    ]
    """

    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": "llama3.1",
                "prompt": prompt,
                "format": "json",
                "stream": False,
                "options": {
                    "temperature": 0.3, # 사실 전달이 중요하므로 창의성 낮춤
                    "num_ctx": 4096     # 10개 처리 위해 컨텍스트 확보
                }
            },
            timeout=60 # 10개 요약이라 시간이 좀 더 걸릴 수 있음 (30초 -> 60초)
        )
        
        result_json = response.json()
        ai_data = json.loads(result_json['response'])
        
        if isinstance(ai_data, dict):
            for key in ai_data:
                if isinstance(ai_data[key], list):
                    ai_data = ai_data[key]
                    break
        
        final_result = []
        for item in ai_data:
            idx = int(item.get('id', -1))
            summary = item.get('summary', '')
            
            if 0 <= idx < len(original_articles):
                link = original_articles[idx]['link']
                final_result.append({
                    "summary": summary,
                    "link": link
                })
        
        # 만약 AI가 10개를 다 못 채웠거나 실패했을 경우 대비
        if not final_result:
            raise Exception("Empty AI result")

        return {"items": final_result}

    except Exception as e:
        print(f"News AI Error: {e}")
        # 에러 발생 시 원본 제목 그대로 10개 반환 (Fallback)
        fallback = []
        for i, article in enumerate(original_articles):
             fallback.append({
                 "summary": f"📰 {article['title']}",
                 "link": article['link']
             })
        return {"items": fallback}