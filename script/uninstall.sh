#!/bin/bash

read -p "請輸入要卸載的依賴包名稱: " pkg
if [ -z "$pkg" ]; then
  echo "未輸入依賴包名稱，操作中止。"
  exit 1
fi
npm uninstall "$pkg"
