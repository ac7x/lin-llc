#!/bin/bash
# filepath: scripts/reset-to.sh

read -p "請輸入要 reset 的 commit hash: " commit
if [ -z "$commit" ]; then
  echo "未輸入 commit hash，操作中止。"
  exit 1
fi
git reset --hard "$commit"