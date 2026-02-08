# backend/store_crawler.py (수정됨)
import asyncio
import re
from playwright.async_api import async_playwright
from sqlalchemy.orm import Session
from database import SessionLocal
from models import WinningStore
from sqlalchemy import func

# --- 설정 ---
START_TURN = 262
MAX_TURN = 2000

async def crawl_past_winning_stores():
    print("🕵️‍♂️ [명당 수집기] 역대 당첨점 크롤링을 시작합니다...")

    db: Session = SessionLocal()
    last_saved = db.query(func.max(WinningStore.turn)).scalar()
    
    if last_saved is None or last_saved < 262:
        current_turn = START_TURN
    else:
        # 🔥 [주의] 수동으로 지우고 다시 돌릴 땐 이 부분 조심해야 함
        # DB에서 1210회를 지웠다면 last_saved는 1209회가 되어야 정상 동작
        current_turn = last_saved + 1
        
    print(f"🔄 {current_turn}회차부터 수집을 시작합니다. (마지막 저장: {last_saved or '없음'})")
    
    async with async_playwright() as p:
        # headless=False로 해서 브라우저 뜨는 거 직접 눈으로 확인 추천!
        browser = await p.chromium.launch(headless=True) 
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()
        
        target_url = "https://www.dhlottery.co.kr/wnprchsplcsrch/home"
        print(f"🌐 지도 페이지 접속 중... ({target_url})")
        
        try:
            await page.goto(target_url, wait_until='networkidle', timeout=60000)
        except:
            print("⚠️ 페이지 로딩 지연 (일단 진행)")

        try:
            await page.wait_for_selector("#srchLtEpsd", state="attached", timeout=10000)
        except:
            print("❌ 페이지 로딩 실패.")
            await browser.close()
            return

        while current_turn < MAX_TURN:
            try:
                print(f"\n➳ [{current_turn}회차] 수집 시도...", end="", flush=True)

                # 옵션 확인
                option_count = await page.locator(f"#srchLtEpsd option[value='{current_turn}']").count()
                if option_count == 0:
                    print(f"\n✅ 최신 회차 도달.")
                    break

                # 1. 회차 선택
                await page.select_option("#srchLtEpsd", str(current_turn))
                
                # 2. 검색 버튼 클릭
                await page.click('#btnSrch')
                try:
                    # 1등 배출점 테이블이 보일 때까지 대기
                    await page.wait_for_selector("#storeDiv .store-box", state="visible", timeout=5000)
                except:
                    print(" -> 데이터 로딩 지연 또는 없음")

                stores_to_save = []

                # ============================================================
                # 1️⃣ [1등 데이터 수집]
                # ============================================================
                try:
                    await page.evaluate("""() => {
                        $('#srchLtWnRank li[value="all"]').removeClass('tagTab');
                        $('#srchLtWnRank li[value="2"]').removeClass('tagTab');
                        $('#srchLtWnRank li[value="1"]').addClass('tagTab');
                        $('#srchLtWnRank li[value="1"]').trigger('click');
                    }""")
                    await page.wait_for_timeout(1000)
                except:
                    pass

                items = await page.locator("#storeDiv .store-box").all()
                
                for item in items:
                    try:
                        store_name = await item.locator(".store-loc").inner_text()
                        rank_text = await item.locator(".draw-rank").inner_text()
                        address = await item.locator(".shpAddr").inner_text()
                        
                        game_type = "알수없음"
                        if await item.locator(".draw-opt").count() > 0:
                            game_type = await item.locator(".draw-opt").inner_text()

                        if "1등" in rank_text:
                            # 1등은 보통 주소까지 같은 경우는 거의 없지만, 혹시 모르니 주소까지 체크
                            if not any(s.rank == 1 and s.store_name == store_name.strip() and s.address == address.strip() for s in stores_to_save):
                                stores_to_save.append(WinningStore(
                                    turn=current_turn, rank=1, store_name=store_name.strip(), 
                                    address=address.strip(), game_type=game_type.strip()
                                ))
                    except Exception as e:
                        continue 

                print(f" 1등({len(stores_to_save)}곳)", end="..")

                # ============================================================
                # 2️⃣ [2등 데이터 수집]
                # ============================================================
                try:
                    await page.evaluate("""() => {
                        $('#srchLtWnRank li[value="1"]').removeClass('tagTab');
                        $('#srchLtWnRank li[value="2"]').addClass('tagTab');
                        $('#srchLtWnRank li[value="2"]').trigger('click');
                    }""")
                    await page.wait_for_timeout(1000)
                except:
                    pass

                # 페이징 루프
                page_num = 1
                while True:
                    # 현재 페이지 아이템 수집 (조금 기다림)
                    items_2nd = await page.locator("#storeDiv .store-box").all()
                    
                    has_new_data = False
                    

                    for item in items_2nd:
                        try:
                            store_name = await item.locator(".store-loc").inner_text()
                            rank_text = await item.locator(".draw-rank").inner_text()
                            address = await item.locator(".shpAddr").inner_text()
                            
                            if "2등" in rank_text:
                                store_name = store_name.strip()
                                address = address.strip()

                                # 🔥 [핵심 수정] 이름 AND 주소로 중복 체크
                                # 같은 이름의 편의점(CU, GS25)이 서로 다른 주소에 있을 수 있음!
                                is_duplicate = any(
                                    s.rank == 2 and 
                                    s.store_name == store_name and 
                                    s.address == address 
                                    for s in stores_to_save
                                )

                                if not is_duplicate:
                                    stores_to_save.append(WinningStore(
                                        turn=current_turn, rank=2, store_name=store_name, 
                                        address=address, game_type=None
                                    ))
                                    has_new_data = True
                                    current_page_count += 1
                        except:
                            continue
                    
                    # 만약 현재 페이지에서 아무것도 못 건졌고, items_2nd도 비어있다면 -> 진짜 끝
                    if not has_new_data and len(items_2nd) == 0: 
                         break
                    
                    # 🔥 [디버깅] 페이지별 수집 개수 출력 (확인용)
                    # print(f"(p{page_num}:{current_page_count}개)", end="")

                    # 다음 페이지 클릭 로직
                    try:
                        next_clicked = await page.evaluate(f"""(pageNum) => {{
                            const links = document.querySelectorAll('.pagination-ul .page-link');
                            for(let a of links) {{
                                // 숫자 버튼 (현재 페이지 + 1) 찾기
                                if(a.innerText.trim() === String(pageNum + 1)) {{ 
                                    a.click(); 
                                    return true; 
                                }}
                            }}
                            // '다음페이지' 이미지 버튼 찾기
                            const nextBtn = document.querySelector('.pagination-ul .btn-arrow a img[alt="다음페이지"]');
                            if(nextBtn && nextBtn.parentElement && nextBtn.parentElement.parentElement) {{
                                nextBtn.parentElement.parentElement.click();
                                return true;
                            }}
                            return false;
                        }}""", page_num)

                        if next_clicked:
                            await page.wait_for_timeout(1000) # 클릭 후 로딩 대기 (1초)
                            page_num += 1
                        else:
                            break # 더 이상 누를 게 없으면 종료
                    except: 
                        break

                total_count = len(stores_to_save)
                print(f" 2등포함 누적({total_count}곳) 완료!", end="")

                # DB 저장
                if stores_to_save:
                    db.add_all(stores_to_save)
                    db.commit()

                current_turn += 1

            except Exception as e:
                print(f"\n⚠️ {current_turn}회차 에러: {e}")
                current_turn += 1
        
        await browser.close()
        db.close()
        print("\n🎉 완료!")

if __name__ == "__main__":
    asyncio.run(crawl_past_winning_stores())