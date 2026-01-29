#!/bin/bash

echo "🛑 MURRO 서비스 종료 중..."

# PM2에 등록된 모든 프로세스 삭제
pm2 delete ecosystem.config.js
pm2 save --force

echo "💤 모든 서비스가 종료되었습니다."
