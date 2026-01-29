#!/bin/bash

# 1. NVM 강제 로드 및 Node v22 설정
export NVM_DIR="/home/murro/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use 22

echo "=========================================="
echo "🚀 [1] 환경 및 네트워크 점검"
echo "   Node Version: $(node -v)"
echo "   NPM Version:  $(npm -v)"
echo "=========================================="

# 2. 인터넷 연결 대기
echo "🌐 [2] 인터넷 연결 확인 중..."
for i in {1..30}; do
    if ping -c 1 google.com &> /dev/null; then
        echo "✅ 인터넷 연결 확인됨! 빌드를 시작합니다."
        break
    fi
    echo "⏳ ($i/30) 네트워크 연결 대기 중... (2초 후 재시도)"
    sleep 2
done

# 3. 프론트엔드 폴더로 이동
cd /home/murro/murro/frontend

# 4. Next.js 빌드 실행 (여기서 딱 한 번만!)
echo "🏗️ [4] Next.js 빌드 시작..."
npm run build

# 빌드 실패 시 중단
if [ $? -ne 0 ]; then
    echo " "
    echo "❌❌❌ [오류] 빌드 실패! (인터넷 연결 불안정 또는 코드 에러)"
    echo "서버를 시작하지 않고 종료합니다."
    exit 1
fi

echo "✅ 빌드 성공!"

# 5. 기존 PM2 프로세스 정리 (깔끔하게 재시작하기 위해)
echo "🧹 기존 PM2 프로세스 정리 중..."
pm2 kill

echo "🚀 MURRO 서비스 시작 중..."

# [삭제됨] 여기서 또 build를 하던 코드를 지웠습니다. (위에서 이미 했으니까요!)

# 6. PM2로 모든 서비스 시작
echo "🔥 Starting Servers with PM2..."
cd /home/murro/murro
# start를 시도하고, 만약 이미 켜져 있다면 reload를 하라는 명령어입니다.
# 지금은 위에서 kill을 했으므로 무조건 start가 실행되며 WARN 로그가 뜨는 게 정상입니다.
pm2 start ecosystem.config.js --update-env || pm2 reload ecosystem.config.js --update-env

# 7. 설정 저장
pm2 save

echo "✅ 모든 서비스가 백그라운드에서 실행 중입니다!"
echo "📊 상태 확인: pm2 status"
echo "📜 로그 확인: pm2 logs"

