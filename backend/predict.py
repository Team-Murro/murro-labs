# backend/predict.py
import torch
import numpy as np
from database import SessionLocal
from models import LottoDraw
from train_model import LottoLSTM, WINDOW_SIZE 

# 🔥 [핵심] 다양성 조절 변수 (기본값: 1.0)
# 1.0 : AI가 예측한 확률 그대로 사용 (지금 상태 - 1번만 계속 나옴)
# 2.0 ~ 3.0 : AI의 고집을 꺾고 골고루 나오게 함 (추천!)
# 10.0 이상 : AI 예측 무시하고 완전 랜덤에 가까워짐
TEMPERATURE = 3 

MODEL_PATH = "/app/models/lotto_model.pth"

def get_ai_prediction():
    # 1. 최신 데이터 가져오기
    db = SessionLocal()
    recents = db.query(LottoDraw).order_by(LottoDraw.turn.desc()).limit(WINDOW_SIZE).all()
    db.close()

    # 과거 -> 최신 순 정렬
    recents.reverse() 
    
    if len(recents) < WINDOW_SIZE:
        return {"error": "데이터가 부족합니다."}

    # 입력 벡터 생성
    input_seq = []
    for draw in recents:
        vec = [0.0] * 45
        nums = [draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6]
        for n in nums:
            vec[n-1] = 1.0
        input_seq.append(vec)
    
    # 2. 모델 로드 및 예측
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = LottoLSTM().to(device)
    
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    except:
        return {"error": "모델 파일이 없습니다."}
        
    model.eval()

    with torch.no_grad():
        X = torch.tensor([input_seq], dtype=torch.float32).to(device)
        output = model(X)
    
    # 3. 가중치 랜덤 추천 (온도 적용)
    ai_scores = output.cpu().numpy()[0]
    
    # [수정된 부분] Temperature 적용 로직
    # 점수에 (1/T)승을 하면 점수 차이가 평평해집니다.
    # 예: T=2.0이면 점수 차이가 절반으로 줄어들어 골고루 뽑힐 확률이 늘어남
    
    # 0으로 나누는 것 방지 (아주 작은 수 더함)
    ai_scores = np.clip(ai_scores, 1e-9, 1.0) 
    
    # 온도 적용: log를 취하고 T로 나눈 뒤 다시 exp (Softmax Temperature Scaling 원리)
    # 하지만 여기선 Sigmoid 출력이므로 간단히 power로 다양성 조절
    weighted_scores = np.power(ai_scores, 1.0 / TEMPERATURE)
    
    # 다시 확률 합이 1이 되도록 정규화
    probs = weighted_scores / weighted_scores.sum()
    
    games = []
    for _ in range(5):
        try:
            picked_indices = np.random.choice(
                np.arange(45), 
                size=6, 
                replace=False, 
                p=probs
            )
            game = (picked_indices + 1).tolist()
            game.sort()
            games.append(game)
        except ValueError:
            # 혹시 확률 계산 에러나면 완전 랜덤으로
            game = list(np.random.choice(np.arange(1, 46), 6, replace=False))
            game.sort()
            games.append(game)
    
    return games

if __name__ == "__main__":
    import pprint
    pprint.pprint(get_ai_prediction())
