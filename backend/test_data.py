from sqlalchemy.orm import Session
from database import SessionLocal
from models import Prediction

# 1205회 당첨번호: 1, 4, 16, 23, 31, 41 + 보너스 2

def inject_test_data():
    db: Session = SessionLocal()
    
    print("🧪 테스트 데이터 주입 시작...")

    # 케이스 1: 1등 당첨 (6개 다 맞음)
    p1 = Prediction(
        turn=1205,
        username="테스트_1등맨",
        p_num1=1, p_num2=4, p_num3=16, p_num4=23, p_num5=31, p_num6=41,
        rank="대기중" # 접속 시 자동 채점됨
    )

    # 케이스 2: 2등 당첨 (5개 + 보너스 2)
    p2 = Prediction(
        turn=1205,
        username="테스트_아깝다",
        p_num1=1, p_num2=4, p_num3=16, p_num4=23, p_num5=31, p_num6=2, # 마지막이 보너스 2
        rank="대기중"
    )

    # 케이스 3: 5등 (3개 맞음)
    p3 = Prediction(
        turn=1205,
        username="테스트_본전",
        p_num1=1, p_num2=4, p_num3=16, p_num4=43, p_num5=44, p_num6=45,
        rank="대기중"
    )

    # 케이스 4: 꽝 (하나도 안 맞음)
    p4 = Prediction(
        turn=1205,
        username="테스트_꽝",
        p_num1=10, p_num2=11, p_num3=12, p_num4=13, p_num5=14, p_num6=15,
        rank="대기중"
    )

    db.add_all([p1, p2, p3, p4])
    db.commit()
    db.close()
    
    print("✅ 테스트 데이터 4건이 들어갔습니다!")
    print("👉 이제 웹사이트에서 [명예의 전당] > [1205회]를 선택해보세요.")

if __name__ == "__main__":
    inject_test_data()
