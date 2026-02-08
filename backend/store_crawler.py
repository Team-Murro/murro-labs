# backend/store_crawler.py
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
        # [주의] DB에서 1210회를 삭제했다면, 1209회 다음인 1210회부터 시작하게 됨
        current_turn = last_saved + 1
        
    print(f"🔄 {current_turn}회차부터 수집을 시작합니다. (마지막 저장: {last_saved or '없음'})")
    
    async with async_playwright() as p:
        # 사용자님 요청대로 원본 설정 유지 (headless=True)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()
        
        target_url = "https://www.dhlottery.co.kr/wnprchsplcsrch/home"
        print(f"🌐 지도 페이지 접속 중... ({target_url})")
        
        try:
            # 🔥 [수정 1] 접속 멈춤 해결
            # 원본의 'networkidle'은 사이트 광고 스크립트 때문에 무한 대기할 수 있습니다.
            # 'domcontentloaded'는 화면만 뜨면 바로 진행하므로 멈추지 않습니다.
            await page.goto(target_url, wait_until='domcontentloaded', timeout=60000)
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
                    await page.wait_for_selector("#storeDiv .store-box", state="visible", timeout=5000)
                except:
                    print(" -> 데이터 로딩 지연 또는 없음")

                stores_to_save = []

                # ============================================================
                # 1️⃣ [1등 데이터 수집] - 원본 로직 유지
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
                            # 1등 중복 체크 (안전하게 이름+주소 비교)
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
                                
                                # 🔥 [수정 2] 데이터 누락 원인이었던 중복 체크 로직 수정
                                # (이름만 보지 않고 주소까지 비교하도록 변경)
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
                        except:
                            continue
                    
                    # 더 이상 새 데이터가 없고 목록도 비었으면 종료
                    if not has_new_data and len(items_2nd) == 0:
                        break

                    # 다음 페이지 클릭 (사용자 원본 로직 그대로 유지)
                    try:
                        next_clicked = await page.evaluate(f"""(pageNum) => {{
                            const links = document.querySelectorAll('.pagination-ul .page-link');
                            for(let a of links) {{
                                if(a.innerText.trim() === String(pageNum + 1)) {{ 
                                    a.click(); 
                                    return true; 
                                }}
                            }}
                            const nextBtn = document.querySelector('.pagination-ul .btn-arrow a img[alt="다음페이지"]');
                            if(nextBtn && nextBtn.parentElement && nextBtn.parentElement.parentElement) {{
                                nextBtn.parentElement.parentElement.click();
                                return true;
                            }}
                            return false;
                        }}""", page_num)

                        if next_clicked:
                            await page.wait_for_timeout(800) # 클릭 후 잠시 대기
                            page_num += 1
                        else:
                            break
                    except: break

                print(f" 2등포함 누적({len(stores_to_save)}곳) 완료!", end="")

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