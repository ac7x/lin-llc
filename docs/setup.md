# ⚙️ 安裝設定指南

本指南將引導您完成 LIN LLC 企業管理系統的詳細安裝和環境設定。

## 📋 系統需求

### 基礎環境
- **Node.js**: 20.x 或更高版本
- **npm**: 8.x 或更高版本 (或 yarn 1.x)
- **Git**: 最新版本
- **瀏覽器**: Chrome 100+、Firefox 100+、Safari 15+、Edge 100+

### 作業系統支援
- Windows 10/11
- macOS 10.15+ (Catalina)
- Ubuntu 20.04+
- 其他主流 Linux 發行版

## 🔧 安裝步驟

### 1. 複製專案

首先複製專案到本地：

`ash
git clone https://github.com/your-org/lin-llc.git
cd lin-llc
`

### 2. 安裝依賴

使用 npm 安裝所有依賴項：

`ash
npm install
`

或使用 yarn：

`ash
yarn install
`

### 3. 環境變數設定

#### 建立環境檔案
`ash
cp .env.example .env.local
`

#### 設定環境變數
編輯 .env.local 檔案，設定以下環境變數：

`ash
# Firebase 設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# App Check
NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=your_recaptcha_site_key
`

## 🔥 Firebase 設定

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱 (建議：lin-llc-production)
4. 選擇是否啟用 Google Analytics
5. 完成專案建立

### 2. 啟用 Firebase 服務

#### Authentication
1. 在 Firebase Console 中選擇「Authentication」
2. 點擊「開始使用」
3. 在「Sign-in method」頁籤中啟用 Google 登入
4. 設定授權網域（localhost、您的網域）

#### Firestore Database
1. 選擇「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式啟動」
4. 選擇資料庫位置（建議：asia-east1）

#### Storage
1. 選擇「Storage」
2. 點擊「開始使用」
3. 選擇安全規則模式
4. 選擇儲存位置

#### App Check
1. 選擇「App Check」
2. 點擊「註冊應用程式」
3. 選擇 reCAPTCHA v3
4. 取得 Site Key

### 3. 取得 Firebase 設定

1. 在專案概覽中點擊「專案設定」
2. 滾動到「您的應用程式」區段
3. 點擊「</> 」圖示新增 Web 應用程式
4. 輸入應用程式暱稱
5. 複製設定物件到環境變數

## 🗺️ Google Maps 設定

### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google Maps JavaScript API
4. 啟用 Places API

### 2. 取得 API Key

1. 前往「憑證」頁面
2. 點擊「建立憑證」> 「API 金鑰」
3. 設定金鑰限制（建議限制 HTTP 來源）
4. 複製 API 金鑰到環境變數

## 🤖 Google Gemini 設定

### 1. 取得 Gemini API Key

1. 前往 [Google AI Studio](https://aistudio.google.com/)
2. 登入您的 Google 帳戶
3. 點擊「Get API key」
4. 建立新的 API 金鑰
5. 複製金鑰到環境變數

## 📁 檔案權限設定

確保以下檔案和目錄具有適當的權限：

`ash
# 設定執行權限
chmod +x script/*.sh

# 確保 .env 檔案安全
chmod 600 .env.local
`

## 🚀 啟動應用程式

### 開發環境

`ash
npm run dev
`

應用程式將在 http://localhost:3000 啟動。

### 生產環境

`ash
# 建置應用程式
npm run build

# 啟動生產伺服器
npm run start
`

## 🧪 驗證安裝

### 1. 檢查環境變數
`ash
npm run check
`

### 2. 測試 Firebase 連線
開啟瀏覽器，前往 http://localhost:3000，確認：
- 頁面正常載入
- Google 登入功能正常
- 無 Firebase 連線錯誤

### 3. 測試 AI 功能
- 點擊 AI 助手按鈕
- 輸入測試訊息
- 確認 AI 回覆正常

## 🔧 常見問題排除

### Node.js 版本問題
`ash
# 檢查 Node.js 版本
node --version

# 使用 nvm 切換版本 (如果已安裝)
nvm use 20
`

### 依賴安裝失敗
`ash
# 清除快取並重新安裝
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
`

### Firebase 連線失敗
1. 檢查環境變數是否正確設定
2. 確認 Firebase 專案設定
3. 檢查網路連線
4. 驗證 API 金鑰權限

### Google Maps 無法載入
1. 檢查 Google Maps API 金鑰
2. 確認 API 已啟用
3. 檢查金鑰限制設定
4. 驗證配額使用情況

## 📊 開發工具設定

### VSCode 擴充功能推薦
`json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json"
  ]
}
`

### 程式碼品質檢查
`ash
# 執行 ESLint 檢查
npm run lint

# 自動修復 ESLint 問題
npm run lint:fix

# 檢查程式碼格式
npm run format:check

# 自動格式化程式碼
npm run format
`

## 🔄 更新指南

### 更新依賴
`ash
# 檢查過期的套件
npm outdated

# 更新所有依賴到最新版本
npm update

# 更新特定套件
npm install package-name@latest
`

### 更新 Firebase SDK
`ash
npm install firebase@latest
`

### 更新 Next.js
`ash
npm install next@latest react@latest react-dom@latest
`

---

完成以上設定後，您的 LIN LLC 企業管理系統就可以正常運行了。如果遇到任何問題，請參考 [開發指南](./development.md) 或聯繫技術支援團隊。
