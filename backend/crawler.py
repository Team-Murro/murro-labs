# backend/crawler.py
import asyncio
import re
from datetime import datetime
from playwright.async_api import async_playwright
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import LottoDraw

# DB 테이블 생성 확인
Base.metadata.create_all(bind=engine)

async def crawl_latest_lotto():
    print("🚀 [크롤러] 동행복권 데이터 수집 시작...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # 1. 페이지 이동
        url = "https://www.dhlottery.co.kr/lt645/result"
        try:
            await page.goto(url, timeout=60000)
            await page.wait_for_load_state('networkidle')
            
            # 2. 결과 박스(.result-infoWrap)가 뜰 때까지 대기
            await page.wait_for_selector(".result-infoWrap", timeout=10000)
            
            # 3. 화면에 있는 모든 결과 박스를 찾음 (보통 이전회차/최신회차 2개가 뜸)
            wraps = page.locator(".result-infoWrap")
            count = await wraps.count()
            print(f"🔎 발견된 결과 박스 개수: {count}개")
            
            latest_turn = 0
            best_data = None

            # 4. 반복문을 돌며 '가장 높은 회차' 정보를 찾음
            for i in range(count):
                wrap = wraps.nth(i)
                text = await wrap.inner_text()
                
                # 정규식으로 '제 1205회' 같은 숫자 추출
                turn_match = re.search(r'제\s*(\d+)회', text)
                if turn_match:
                    current_turn = int(turn_match.group(1))
                    
                    # 더 높은 회차가 나오면 정보 갱신
                    if current_turn > latest_turn:
                        latest_turn = current_turn
                        
                        # 날짜 추출 (2026.01.03)
                        date_match = re.search(r'(\d{4}\.\d{2}\.\d{2})', text)
                        draw_date = datetime.strptime(date_match.group(1), "%Y.%m.%d").date() if date_match else None
                        
                        # 번호 추출 (박스 안에서 '공' 모양을 가진 요소를 따로 찾음)
                        # span 태그 중 class에 'ball'이나 'num'이 포함된 것들
                        # 구조상 당첨번호 6개 + 보너스번호 1개 순서로 나옴
                        ball_els = await wrap.locator("span[class*='ball'], div[class*='ball']").all_inner_texts()
                        
                        # 숫자만 필터링 (혹시 모를 문자 제거)
                        numbers = [int(n) for n in ball_els if n.isdigit()]
                        
                        if len(numbers) >= 7:
                            best_data = {
                                "turn": current_turn,
                                "date": draw_date,
                                "nums": numbers[:6],     # 앞 6개
                                "bonus": numbers[-1]     # 마지막 1개
                            }

            # 5. DB 저장 로직
            if best_data:
                print(f"🎉 최신 데이터 확보! [{best_data['turn']}회] {best_data['nums']} + {best_data['bonus']}")
                
                db: Session = SessionLocal()
                existing = db.query(LottoDraw).filter(LottoDraw.turn == best_data['turn']).first()
                
                if not existing:
                    new_draw = LottoDraw(
                        turn=best_data['turn'],
                        draw_date=best_data['date'],
                        num1=best_data['nums'][0], num2=best_data['nums'][1], num3=best_data['nums'][2],
                        num4=best_data['nums'][3], num5=best_data['nums'][4], num6=best_data['nums'][5],
                        bonus=best_data['bonus']
                    )
                    db.add(new_draw)
                    db.commit()
                    print("💾 DB 저장 완료!")
                    result = best_data
                else:
                    print("✨ 이미 DB에 존재하는 회차입니다.")
                    result = best_data
                db.close()
            else:
                print("❌ 유효한 로또 데이터를 찾지 못했습니다.")
                result = None

        except Exception as e:
            print(f"⚠️ 크롤링 중 에러 발생: {e}")
            result = None
            
        await browser.close()
        return result

if __name__ == "__main__":
    asyncio.run(crawl_latest_lotto())
