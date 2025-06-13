#!/bin/bash

# 設定嚴格模式
set -e

echo "開始除錯流程..."

# 清除並重新安裝套件
echo "清除 node_modules..."
rm -rf node_modules
echo "重新安裝套件..."
npm install

# 執行建置
echo "執行建置檢查..."
npm run build

# 部署到 Firebase
echo "部署到 Firebase App Hosting..."
firebase deploy --only apphosting

echo "除錯流程完成"
