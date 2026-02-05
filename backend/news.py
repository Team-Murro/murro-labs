import feedparser
import requests
import json
import os
import re

# [설정] K3s 환경 대응
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://10.42.0.1:11434")

# [수정] 특정 카테고리가 아닌 '대한민국 주요 뉴스(Top Stories)' 전체 RSS
RSS_URL = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"

async def get_ai_news_briefing():
    # 1. RSS 파싱 (최신 10개 후보군 확보)
    original_articles = []
    try:
        feed = feedparser.parse(RSS_URL)
        # AI에게 선택권을 주기 위해 넉넉히 10개를 가져옵니다.
        entries = feed.entries[:10] 
        
        news_context = ""
        for i, entry in enumerate(entries):
            title = entry.title
            if ' - ' in title: # 언론사명 제거 (깔끔하게)
                title = title.split(' - ')[0]
            
            # 원본 데이터 저장 (나중에 링크 찾기 위해)
            original_articles.append({"title": title, "link": entry.link})
            
            # AI에게 던져줄 텍스트 구성 (번호표 부착)
            news_context += f"[{i}] {title}\n"
            
    except Exception as e:
        print(f"RSS Parsing Error: {e}")
        return {"items": [{"summary": "뉴스 데이터를 가져올 수 없습니다.", "link": "#"}]}

    # 2. Ollama에게 3줄 요약 + 인덱스 선택 요청
    prompt = f"""
    Context (Top 10 News Headlines with IDs):
    {news_context}

    Task:
    1. Select the 3 most important/interesting news items.
    2. Summarize each into a short Korean sentence (under 60 chars).
    3. Return the original ID (index) so we can link to the source.

    Format: JSON List of Objects
    Example:
    [
        {{ "id": 0, "summary": "📉 코스피, 외인 매도세에 2500선 턱걸이 마감" }},
        {{ "id": 3, "summary": "📱 삼성전자, AI 기능 강화된 갤럭시 S25 공개" }},
        {{ "id": 7, "summary": "⚽ 손흥민, 시즌 10호골 폭발... 팀 승리 견인" }}
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
                    "temperature": 0.3 # 정확도를 위해 창의성 낮춤
                }
            },
            timeout=40
        )
        
        result_json = response.json()
        ai_data = json.loads(result_json['response'])
        
        # AI 응답이 리스트가 아니라 딕셔너리로 감싸져 있을 경우 대응 (items 키 등)
        if isinstance(ai_data, dict):
            for key in ai_data:
                if isinstance(ai_data[key], list):
                    ai_data = ai_data[key]
                    break
        
        final_result = []
        for item in ai_data:
            idx = int(item.get('id', 0))
            summary = item.get('summary', '')
            
            # 인덱스 범위 체크 (안전장치)
            if 0 <= idx < len(original_articles):
                link = original_articles[idx]['link']
                final_result.append({
                    "summary": summary,
                    "link": link
                })
        
        # 만약 AI가 이상한 형식을 줬거나 빈 리스트라면 앞에서부터 3개 강제 할당
        if not final_result:
            raise Exception("AI output parsing failed")

        return {"items": final_result}

    except Exception as e:
        print(f"News AI Error: {e}")
        # 에러 시 그냥 1,2,3번 기사 제목 + 링크 반환
        fallback = []
        for i in range(min(3, len(original_articles))):
             fallback.append({
                 "summary": f"📰 {original_articles[i]['title']}",
                 "link": original_articles[i]['link']
             })
        return {"items": fallback}