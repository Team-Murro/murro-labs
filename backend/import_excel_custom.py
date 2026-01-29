# backend/import_excel_custom.py
import pandas as pd
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import LottoDraw

# 테이블 생성 확인
Base.metadata.create_all(bind=engine)

def import_custom_excel():
    # 파일명 (확장자 주의)
    file_path = "lotto.xlsx"  # xlsx로 가정 (스크린샷이 최신 엑셀 같아서)
    if not os.path.exists(file_path):
        file_path = "lotto.xls"
        if not os.path.exists(file_path):
            print("❌ 'lotto.xlsx' 또는 'lotto.xls' 파일을 backend 폴더에 넣어주세요!")
            return

    print(f"📂 '{file_path}' 파일을 사용자 맞춤형으로 분석합니다...")

    try:
        # 스크린샷 기준: 1번째 줄(header=0)이 헤더
        df = pd.read_excel(file_path, header=0)
        print("✅ 엑셀 파일 로드 성공!")
    except Exception as e:
        print(f"❌ 파일 읽기 실패: {e}")
        return

    db: Session = SessionLocal()
    count = 0
    
    # 로또 1회차 기준일 (2002년 12월 7일)
    base_date = datetime(2002, 12, 7).date()

    print(f"📊 총 {len(df)}개 데이터 분석 시작...")

    for idx, row in df.iterrows():
        try:
            # 1. 회차 처리 (1,205 처럼 콤마가 있을 수 있음)
            # 엑셀의 '회차' 컬럼 (B열 -> 인덱스 1)
            turn_val = row.iloc[1]
            
            # 값이 없거나 숫자가 아니면 스킵
            if pd.isna(turn_val): continue
            
            # 문자열로 바꿔서 콤마 제거 후 정수 변환
            turn = int(str(turn_val).replace(',', ''))
            
            # 2. 날짜 계산 (엑셀에 날짜가 없으므로 회차로 계산)
            # 공식: 1회차 날짜 + (회차-1) * 7일
            draw_date = base_date + timedelta(weeks=(turn - 1))

            # 3. 번호 추출 (C열 ~ H열 -> 인덱스 2~7)
            # 스크린샷 기준 당첨번호가 6개 컬럼에 나눠져 있음
            num1 = int(row.iloc[2])
            num2 = int(row.iloc[3])
            num3 = int(row.iloc[4])
            num4 = int(row.iloc[5])
            num5 = int(row.iloc[6])
            num6 = int(row.iloc[7])
            
            # 4. 보너스 번호 (I열 -> 인덱스 8)
            bonus = int(row.iloc[8])

            # 5. DB 저장 (중복 체크)
            existing = db.query(LottoDraw).filter(LottoDraw.turn == turn).first()
            if not existing:
                new_draw = LottoDraw(
                    turn=turn,
                    draw_date=draw_date,
                    num1=num1, num2=num2, num3=num3, num4=num4, num5=num5, num6=num6,
                    bonus=bonus
                )
                db.add(new_draw)
                count += 1

        except Exception as e:
            # print(f"⚠️ {idx}행 처리 중 에러: {e}") 
            continue

    db.commit()
    db.close()
    print(f"🎉 작업 완료! 총 {count}개 회차 정보를 DB에 저장했습니다.")

if __name__ == "__main__":
    import_custom_excel()
