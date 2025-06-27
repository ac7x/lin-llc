#!/bin/bash

# =============================================
# 除錯腳本
# 
# 此腳本用於執行完整的除錯流程，包含：
# - 清除並重新安裝所有依賴套件
# - 執行專案建置檢查
# - 可選擇部署到 Firebase
# 
# 使用方式：
# ./script/debug.sh
# =============================================

# 設定嚴格模式
set -e

echo "開始除錯流程..."

# 清除並重新安裝套件
echo "=========================================="
echo "清除 node_modules..."
rm -rf node_modules

echo "清除 .next 快取..."
rm -rf .next

echo "清除 package-lock.json..."
rm -f package-lock.json

echo "清除 npm 快取..."
npm cache clean --force

echo "重新安裝套件..."
npm install

# 執行程式碼檢查
echo "=========================================="
echo "執行程式碼檢查..."
npm run lint

echo "執行型別檢查..."
npm run type-check

# 執行建置
echo "=========================================="
echo "執行建置檢查..."
npm run build

# 詢問是否要部署
echo "=========================================="
read -p "是否要部署到 Firebase? (y/N): " deploy_choice
if [[ $deploy_choice =~ ^[Yy]$ ]]; then
    echo "部署到 Firebase..."
    npm run fd
else
    echo "跳過部署步驟。"
fi

echo "=========================================="
echo "除錯流程完成！"
