#!/bin/bash

# =============================================
# Git 重置腳本
# 
# 此腳本用於重置 Git 倉庫到指定的 commit，功能包含：
# - 互動式輸入 commit hash
# - 安全檢查和確認
# - 執行 git reset --hard
# 
# 使用方式：
# ./script/git-reset.sh
# =============================================

set -e

echo "Git 重置工具"
echo "============================================="

# 顯示當前 git 狀態
echo "當前分支信息："
git branch -v

echo ""
echo "最近的 commit 歷史："
git log --oneline -10

echo ""
echo "============================================="

# 輸入 commit hash
read -p "請輸入要重置到的 commit hash: " commit
if [ -z "$commit" ]; then
    echo "錯誤：未輸入 commit hash，操作中止。"
    exit 1
fi

# 驗證 commit hash 是否存在
if ! git cat-file -e "$commit" 2>/dev/null; then
    echo "錯誤：無效的 commit hash: $commit"
    exit 1
fi

# 顯示目標 commit 信息
echo ""
echo "目標 commit 信息："
git show --no-patch --format="Hash: %H%nAuthor: %an%nDate: %ad%nMessage: %s" "$commit"

echo ""
echo "警告：這將永久刪除 $commit 之後的所有變更！"
read -p "確定要繼續嗎？(y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo "執行 git reset --hard $commit..."
    git reset --hard "$commit"
    echo "Git 重置完成！"
else
    echo "已取消操作。"
    exit 0
fi 