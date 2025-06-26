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
    "建置專案 (build)"
    "啟動生產伺服器 (start)"
    "程式碼檢查 (lint)"
    "自動修復 ESLint 問題 (lint:fix)"
    "格式化程式碼 (format)"
    "檢查程式碼格式 (format:check)"
    "TypeScript 型別檢查 (type-check)"
    "完整檢查 (check)"
    "檔名大小寫檢查 (check-case)"
    "啟動 Firebase 模擬器 (fes)"
    "部署到 Firebase (fd)"
    "僅部署 Hosting (fdb)"
    "專案重置 (reset)"
    "除錯流程 (debug)"
    "Git 重置到指定 commit (git-reset)"
    "手動清除 .next 資料夾"
    "手動清除 node_modules 資料夾"
    "互動安裝依賴 (install-pkg)"
    "互動卸載依賴 (uninstall-pkg)"
    "強制推送到 main (pfm)"
    "重設本地為遠端 main (rb)"
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
    echo "請使用上下鍵選擇要執行的指令（按 Enter 確認）："
    echo "============================================="
    for opt in "${options[@]}"; do
        if [ $i -eq $current ]; then
            echo "→ $opt"
        else
            echo "  $opt"
        fi
        ((i++))
    done
    echo "============================================="
    echo "提示：使用 ↑↓ 鍵導航，Enter 確認，Ctrl+C 退出"
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

echo "執行選擇的指令..."
echo "============================================="

# 執行選擇的指令
case $current in
    0) npm run dev ;;
    1) npm run build ;;
    2) npm run start ;;
    3) npm run lint ;;
    4) npm run lint:fix ;;
    5) npm run format ;;
    6) npm run format:check ;;
    7) npm run type-check ;;
    8) npm run check ;;
    9) npm run check-case ;;
    10) npm run fes ;;
    11) npm run fd ;;
    12) npm run fdb ;;
    13) npm run reset ;;
    14) npm run debug ;;
    15) npm run git-reset ;;
    16) 
        echo "清除 .next 資料夾..."
        rm -rf .next && echo ".next 資料夾已移除。" 
        ;;
    17) 
        echo "清除 node_modules 資料夾..."
        rm -rf node_modules && echo "node_modules 資料夾已移除。" 
        ;;
    18) npm run install-pkg ;;
    19) npm run uninstall-pkg ;;
    20) 
        echo "警告：這將強制推送到 main 分支！"
        read -p "確定要繼續嗎？(y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            npm run pfm
        else
            echo "已取消操作。"
        fi
        ;;
    21) 
        echo "警告：這將重設本地 main 分支為遠端版本！"
        read -p "確定要繼續嗎？(y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            npm run rb
        else
            echo "已取消操作。"
        fi
        ;;
    22) echo "已離開。"; exit 0 ;;
esac

echo "============================================="
echo "指令執行完成！"