# 程式碼生成與撰寫規範

## 一般原則
- 保持程式碼簡潔、易讀、易維護。
- 優先考慮型別安全，避免使用 `any`、`Object` 等不明確型別。
- 遵循專案既有的命名規範與目錄結構。
- 避免重複程式碼，善用函式與元件重用。
- 所有公開 API、函式、類別需加上適當註解與型別說明。
- 盡量使用現代語法（如 ES6+、TypeScript 等）。

## TypeScript/JavaScript 實用提醒
- 嚴格使用型別註記，避免 `any`。
- 優先使用 `interface` 或 `type` 定義資料結構。
- 使用 `const`、`let` 取代 `var`。
- 避免魔法數字，使用常數或列舉。
- 盡量使用解構賦值提升可讀性。
- 使用 async/await 處理非同步流程，避免 callback hell。

## 其他建議
- 每個 PR 需附上單元測試，確保程式碼正確性。
- 變更需通過自動化測試與靜態分析（如 ESLint、Prettier）。
- 重要邏輯請加上註解，方便他人理解。
- 保持 commit 訊息簡潔明確。

---
如有疑問，請參考專案文件或聯絡維護者。