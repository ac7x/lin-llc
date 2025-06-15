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

rm -rf node_modules

read -p "請輸入要 reset 的 commit hash: " commit
if [ -z "$commit" ]; then
  echo "未輸入 commit hash，操作中止。"
  exit 1
fi
git reset --hard "$commit"