#!/bin/bash
# filepath: scripts/reset.sh

# =============================================
# 專案重置腳本
# 
# 此腳本用於重置專案狀態，功能包含：
# - 清除 node_modules 目錄
# - 清除 .next 快取目錄
# - 清除 package-lock.json
# - 重新安裝所有依賴套件
# 
# 使用方式：
# ./script/reset.sh
# =============================================

set -e

echo "開始重置專案狀態..."

# 清除 node_modules
if [ -d "node_modules" ]; then
    echo "清除 node_modules..."
    rm -rf node_modules
else
    echo "node_modules 目錄不存在，跳過清除。"
fi

# 清除 .next 快取
if [ -d ".next" ]; then
    echo "清除 .next 快取..."
    rm -rf .next
else
    echo ".next 目錄不存在，跳過清除。"
fi

# 清除 package-lock.json
if [ -f "package-lock.json" ]; then
    echo "清除 package-lock.json..."
    rm -f package-lock.json
else
    echo "package-lock.json 不存在，跳過清除。"
fi

# 清除 npm 快取
echo "清除 npm 快取..."
npm cache clean --force

# 重新安裝依賴
echo "重新安裝依賴套件..."
npm install

echo "專案重置完成！"