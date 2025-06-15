#!/bin/bash

# =============================================
# 腳本管理工具
# 
# 此腳本用於管理其他腳本的執行，功能包含：
# - 顯示可用腳本列表
# - 互動式選擇腳本
# - 執行選定的腳本
# - 錯誤處理
# 
# 使用方式：
# ./script/script.sh
# =============================================

echo "請選擇要執行的腳本："

# 定義選項陣列
options=(
    "開發模式 (dev)"
    "建置 (build)"
    "啟動伺服器 (start)"
    "程式碼檢查 (lint)"
    "啟動 Firebase 模擬器 (fes)"
    "Firebase deploy (fd)"
    "重設到指定 commit (reset)"
    "強制推送 main (pfm)"
    "重設本地 main 為遠端 (rb)"
    "移除 .next 資料夾"
    "移除 node_modules 資料夾"
    "互動卸載依賴 (uninstall.sh)"
    "互動安裝依賴 (install.sh)"
    "離開"
)

# 初始化選擇索引
current=0
total=${#options[@]}

# 清除螢幕
clear

# 顯示選項的函式
show_menu() {
    local i=0
    echo "請使用上下鍵選擇要執行的指令（按Enter確認）："
    echo "============================================="
    for opt in "${options[@]}"; do
        if [ $i -eq $current ]; then
            echo "→ $opt"
        else
            echo "  $opt"
        fi
        ((i++))
    done
}

# 主循環
while true; do
    # 顯示選單
    show_menu

    # 讀取鍵盤輸入
    read -rsn1 key
    if [[ $key = "" ]]; then  # Enter鍵
        break
    elif [[ $key = $'\x1b' ]]; then
        read -rsn2 key
        case $key in
            '[A') # 上鍵
                ((current--))
                [ $current -lt 0 ] && current=$((total-1))
                ;;
            '[B') # 下鍵
                ((current++))
                [ $current -ge $total ] && current=0
                ;;
        esac
    fi
    clear
done

# 執行選擇的指令
case $current in
    0) npm run dev ;;
    1) npm run build ;;
    2) npm run start ;;
    3) npm run lint ;;
    4) npm run fes ;;
    5) npm run fd ;;
    6) npm run reset ;;
    7) npm run pfm ;;
    8) npm run rb ;;
    9) rm -rf .next && echo ".next 資料夾已移除。" ;;
    10) rm -rf node_modules && echo "node_modules 資料夾已移除。" ;;
    11) bash script/uninstall.sh ;;
    12) bash script/install.sh ;;
    13) echo "已離開。"; exit 0 ;;
esac