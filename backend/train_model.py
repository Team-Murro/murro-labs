# backend/train_model.py
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from sqlalchemy.orm import Session
from database import SessionLocal
from models import LottoDraw

# --- 1. 설정 ---
WINDOW_SIZE = 20       # 과거 5회차를 보고 다음을 예측
HIDDEN_SIZE = 256     # AI 두뇌 크기 (클수록 복잡한 패턴 학습)
LAYERS = 3            # LSTM 층 개수
EPOCHS = 5000         # 학습 반복 횟수 (많을수록 오래 걸리지만 정확해질 수 있음)
LEARNING_RATE = 0.001

# --- 2. 데이터 준비 함수 ---
def prepare_data():
    db: Session = SessionLocal()
    # 1회부터 최신회차까지 정렬해서 가져옴
    draws = db.query(LottoDraw).order_by(LottoDraw.turn.asc()).all()
    db.close()

    if not draws:
        print("❌ 데이터가 없습니다.")
        return None, None

    # 데이터를 [0, 0, 1, ... 0] 형태의 45개짜리 벡터로 변환 (번호가 나오면 1, 아니면 0)
    # 로또 번호는 1~45이므로 인덱스 0~44에 매핑
    data_vectors = []
    for draw in draws:
        vec = [0.0] * 45
        # 당첨번호 6개만 사용 (보너스 제외)
        nums = [draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6]
        for n in nums:
            vec[n-1] = 1.0 # 해당 번호 인덱스를 1로 설정
        data_vectors.append(vec)
    
    X = [] # 입력 (과거 5개)
    y = [] # 정답 (다음 1개)

    for i in range(len(data_vectors) - WINDOW_SIZE):
        X.append(data_vectors[i : i + WINDOW_SIZE])
        y.append(data_vectors[i + WINDOW_SIZE])

    # PyTorch 텐서로 변환 (GPU 사용 준비)
    return torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.float32)

# --- 3. LSTM 모델 정의 ---
class LottoLSTM(nn.Module):
    def __init__(self):
        super(LottoLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size=45, hidden_size=HIDDEN_SIZE, num_layers=LAYERS, batch_first=True)
        self.fc = nn.Linear(HIDDEN_SIZE, 45) # 45개 번호에 대한 확률 출력
        self.sigmoid = nn.Sigmoid() # 확률값(0~1)으로 변환

    def forward(self, x):
        # x: (batch, window_size, 45)
        out, _ = self.lstm(x) 
        # 마지막 시점의 결과만 사용
        out = out[:, -1, :] 
        out = self.fc(out)
        out = self.sigmoid(out)
        return out

# --- 4. 학습 실행 ---
def train():
    # GPU 확인
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🚀 학습 시작! 사용 장치: {device}")
    if device.type == 'cuda':
        print(f"   GPU 모델: {torch.cuda.get_device_name(0)}")

    X, y = prepare_data()
    if X is None: return

    # 데이터를 GPU로 이동
    X = X.to(device)
    y = y.to(device)

    model = LottoLSTM().to(device)
    criterion = nn.BCELoss() # 바이너리 크로스 엔트로피 (각 번호가 나올 확률 맞추기)
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    model.train()
    for epoch in range(EPOCHS):
        optimizer.zero_grad()
        output = model(X)
        loss = criterion(output, y)
        loss.backward()
        optimizer.step()

        if (epoch+1) % 100 == 0:
            print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {loss.item():.6f}")

    # 모델 저장
    torch.save(model.state_dict(), "lotto_model.pth")
    print("💾 모델 저장 완료: lotto_model.pth")

if __name__ == "__main__":
    train()
