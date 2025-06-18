# Google Maps API 設置說明

## 功能說明

專案中的地址欄位現在支援 Google Maps 整合功能，包括：
- 地址自動完成
- 點擊地圖圖標開啟 Google 地圖選址
- 在地圖上直接點擊選擇地址
- 支援拖曳標記到精確位置

## 設置步驟

### 1. 創建 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用以下 API：
   - Maps JavaScript API
   - Places API
   - Geocoding API

### 2. 創建 API 金鑰

1. 在 Google Cloud Console 中，前往「憑證」頁面
2. 點擊「建立憑證」→「API 金鑰」
3. 複製生成的 API 金鑰

### 3. 設置環境變數

在專案根目錄創建 `.env.local` 文件，並添加以下內容：

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 4. 限制 API 金鑰（建議）

為了安全起見，建議在 Google Cloud Console 中限制 API 金鑰的使用：

1. 前往「憑證」頁面
2. 點擊您的 API 金鑰
3. 在「應用程式限制」中選擇「HTTP 參照網址」
4. 添加您的網域（例如：`https://yourdomain.com/*`）
5. 在「API 限制」中選擇「限制金鑰」，並只選擇需要的 API

## 使用方式

### 在專案編輯中

1. 開啟專案編輯彈窗
2. 在地址欄位中：
   - 直接輸入地址（支援自動完成）
   - 點擊地圖圖標開啟地圖選址
   - 在地圖上點擊選擇位置
   - 拖曳標記到精確位置

### 程式碼使用

```tsx
import AddressSelector from '@/components/common/AddressSelector';

<AddressSelector
    value={address}
    onChange={(newAddress) => setAddress(newAddress)}
    placeholder="請輸入或選擇地址"
/>
```

## 注意事項

1. **API 配額**：Google Maps API 有使用配額限制，請注意使用量
2. **費用**：超過免費配額後會產生費用，請監控使用情況
3. **地區限制**：目前設置為僅限台灣地區的地址
4. **瀏覽器支援**：需要支援 JavaScript 的現代瀏覽器

## 故障排除

### API 金鑰無效
- 檢查 API 金鑰是否正確
- 確認已啟用必要的 API
- 檢查 API 金鑰的限制設置

### 地圖無法載入
- 檢查網路連線
- 確認 API 金鑰有足夠的配額
- 檢查瀏覽器控制台是否有錯誤訊息

### 地址自動完成不工作
- 確認已啟用 Places API
- 檢查 API 金鑰的網域限制
- 確認瀏覽器支援 JavaScript 