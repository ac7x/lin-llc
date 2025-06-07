import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { firebaseApp } from './firebase-client';

// 從環境變數取得 reCAPTCHA site key，fallback 到硬編碼值
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY || '6LepxlYrAAAAAMxGh5307zIOJHz1PKrVDgZHgKwg';

// 除錯：印出實際使用的 site key
if (typeof window !== 'undefined') {
  console.log('🔑 App Check using site key:', RECAPTCHA_SITE_KEY);
  console.log('🌐 Current domain:', window.location.hostname);
}

let appCheck: ReturnType<typeof initializeAppCheck> | null = null;

// 詳細日誌記錄函數，返回訊息以便外部使用
function logDetailed(message: string): string {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  return logMessage;
}

// 檢查 grecaptcha 物件的詳細信息
function inspectGrecaptcha(): string {
  if (typeof window === 'undefined') {
    return 'Server-side environment, no window object';
  }

  const details: string[] = [];
  
  details.push(`window.grecaptcha exists: ${typeof window.grecaptcha !== 'undefined'}`);
  
  if (typeof window.grecaptcha !== 'undefined') {
    const g = window.grecaptcha;
    details.push(`grecaptcha type: ${typeof g}`);
    details.push(`grecaptcha.ready exists: ${typeof g.ready === 'function'}`);
    details.push(`grecaptcha.execute exists: ${typeof g.execute === 'function'}`);
    // details.push(`grecaptcha.render exists: ${typeof g.render === 'function'}`); // 已移除
    // 顯示所有可用的屬性
    try {
      const props = Object.getOwnPropertyNames(g);
      details.push(`Available properties: [${props.join(', ')}]`);
    } catch (e) {
      details.push(`Cannot inspect properties: ${String(e)}`);
    }
  }
  
  return details.join('\n');
}

/**
 * 初始化 Firebase App Check
 * 必須在使用 Firebase 服務前呼叫
 */
export function initializeFirebaseAppCheck(logger?: (message: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = (message: string) => {
      const logMsg = logDetailed(message);
      if (logger) logger(logMsg);
      return logMsg;
    };

    if (typeof window === 'undefined') {
      // 伺服器端不需要初始化 App Check
      log('Server-side detected, skipping App Check initialization');
      resolve();
      return;
    }

    if (appCheck) {
      // 已經初始化過
      log('App Check already initialized');
      resolve();
      return;
    }

    try {
      log('Starting App Check initialization...');
      
      // 設定最大等待時間 (8 秒)
      const maxWaitTime = 8000;
      const startTime = Date.now();
      let attemptCount = 0;

      // 等待 grecaptcha 載入
      const waitForGrecaptcha = () => {
        attemptCount++;
        const elapsed = Date.now() - startTime;
        
        log(`App Check attempt ${attemptCount}, elapsed: ${elapsed}ms`);
        
        // 詳細檢查 grecaptcha 物件
        const inspection = inspectGrecaptcha();
        log(`Grecaptcha inspection:\n${inspection}`);

        if (typeof window.grecaptcha !== 'undefined') {
          try {
            // 使用標準版本的 reCAPTCHA API
            log('Using standard reCAPTCHA API...');
            
            if (window.grecaptcha.ready) {
              window.grecaptcha.ready(async () => {
                try {
                  log('Standard reCAPTCHA ready callback triggered, initializing App Check...');
                  appCheck = initializeAppCheck(firebaseApp, {
                    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
                    isTokenAutoRefreshEnabled: true,
                  });
                  log('✅ Firebase App Check initialized successfully with standard reCAPTCHA');
                  
                  // 等待一段時間讓 App Check 完全準備就緒
                  log('⏳ 等待 App Check 完全準備就緒...');
                  await new Promise(resolve => setTimeout(resolve, 3000)); // 增加到 3 秒
                  log('✅ App Check 準備完成');
                  
                  resolve();
                } catch (initError) {
                  const errorMsg = `App Check initialization failed: ${String(initError)}`;
                  log(`❌ ${errorMsg}`);
                  reject(new Error(errorMsg));
                }
              });
            } else {
              const errorMsg = `Standard reCAPTCHA ready method is not available`;
              log(`❌ ${errorMsg}`);
              reject(new Error(errorMsg));
            }
          } catch (initError) {
            const errorMsg = `Failed to initialize App Check with reCAPTCHA: ${String(initError)}`;
            log(`❌ ${errorMsg}`);
            reject(new Error(errorMsg));
          }
        } else if (elapsed > maxWaitTime) {
          // 超時
          const errorMsg = `App Check initialization timeout after ${elapsed}ms. grecaptcha not available.`;
          log(`❌ ${errorMsg}`);
          log('Possible causes:');
          log('  - reCAPTCHA script loading failed');
          log('  - Network connectivity issues');
          log('  - Ad blockers interference');
          log('  - Firebase configuration errors');
          log('  - Incorrect reCAPTCHA site key');
          reject(new Error(errorMsg));
        } else {
          // 繼續等待 grecaptcha 載入
          setTimeout(waitForGrecaptcha, 100);
        }
      };

      waitForGrecaptcha();
    } catch (error) {
      const errorMsg = `App Check setup failed: ${String(error)}`;
      log(`❌ ${errorMsg}`);
      reject(new Error(errorMsg));
    }
  });
}

/**
 * 取得 App Check token (增強版本含重試機制)
 * 在進行 Firebase 操作前可選擇性呼叫以確保 token 有效
 */
export async function getAppCheckToken(logger?: (message: string) => void): Promise<string | null> {
  const log = (message: string) => {
    const logMsg = logDetailed(message);
    if (logger) logger(logMsg);
    return logMsg;
  };

  if (!appCheck) {
    log('❌ App Check not initialized, cannot get token');
    return null;
  }

  const maxRetries = 3;
  const timeoutMs = 8000; // 8 秒超時

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`🔐 嘗試取得 App Check token (第 ${attempt}/${maxRetries} 次)`);
    
    try {
      // 使用 Promise.race 實現超時控制
      const tokenPromise = getToken(appCheck);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Token request timeout after ${timeoutMs}ms`)), timeoutMs);
      });

      const tokenResult = await Promise.race([tokenPromise, timeoutPromise]);
      
      if (tokenResult && tokenResult.token) {
        log(`✅ App Check token 取得成功 (長度: ${tokenResult.token.length})`);
        log(`🔍 Token 前 20 字元: ${tokenResult.token.substring(0, 20)}...`);
        return tokenResult.token;
      } else {
        log(`⚠️ Token result 為空或無效: ${JSON.stringify(tokenResult)}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`❌ 第 ${attempt} 次嘗試失敗: ${errorMsg}`);
      
      // 詳細診斷錯誤
      if (errorMsg.includes('timeout')) {
        log('   原因: 請求超時 - 可能是網路問題或 Firebase 服務回應緩慢');
      } else if (errorMsg.includes('recaptcha')) {
        log('   原因: reCAPTCHA 相關錯誤 - 檢查 site key 和網域設定');
      } else if (errorMsg.includes('appcheck')) {
        log('   原因: App Check 服務錯誤 - 檢查 Firebase 專案設定');
      } else {
        log(`   未知錯誤類型: ${errorMsg}`);
      }
      
      if (attempt === maxRetries) {
        log(`❌ 所有嘗試都失敗了，放棄取得 token`);
        return null;
      }
      
      // 等待一段時間後重試
      const waitTime = attempt * 1000; // 1秒, 2秒, 3秒
      log(`⏳ 等待 ${waitTime}ms 後重試...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return null;
}

/**
 * 檢查 App Check 是否已初始化
 */
export function isAppCheckInitialized(): boolean {
  return appCheck !== null;
}

/**
 * 取得 App Check 詳細狀態
 */
export function getAppCheckStatus() {
  return {
    initialized: appCheck !== null,
    hasGrecaptcha: typeof window !== 'undefined' && typeof window.grecaptcha !== 'undefined',
    grecaptchaReady: typeof window !== 'undefined' && typeof window.grecaptcha?.ready === 'function',
    canExecute: typeof window !== 'undefined' && typeof window.grecaptcha?.execute === 'function',
    currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
    siteKey: RECAPTCHA_SITE_KEY,
  };
}

/**
 * 測試 reCAPTCHA 執行 (不依賴 App Check)
 */
export async function testRecaptchaExecution(logger?: (message: string) => void): Promise<boolean> {
  const log = (message: string) => {
    const logMsg = logDetailed(message);
    if (logger) logger(logMsg);
    return logMsg;
  };

  if (typeof window === 'undefined') {
    log('❌ 伺服器端環境，無法測試 reCAPTCHA');
    return false;
  }

  if (typeof window.grecaptcha === 'undefined') {
    log('❌ window.grecaptcha 不存在');
    return false;
  }

  if (typeof window.grecaptcha.execute !== 'function') {
    log('❌ window.grecaptcha.execute 不是函數');
    return false;
  }

  try {
    log(`🧪 測試 reCAPTCHA 執行，site key: ${RECAPTCHA_SITE_KEY}`);
    log(`🌐 當前網域: ${window.location.hostname}`);
    
    const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'test_action' });
    
    if (token && token.length > 0) {
      log(`✅ reCAPTCHA 執行成功，token 長度: ${token.length}`);
      log(`🔍 Token 前 30 字元: ${token.substring(0, 30)}...`);
      return true;
    } else {
      log('❌ reCAPTCHA 執行返回空 token');
      return false;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`❌ reCAPTCHA 執行失敗: ${errorMsg}`);
    
    // 詳細診斷可能的錯誤原因
    if (errorMsg.includes('Invalid site key')) {
      log('   🔍 可能原因: reCAPTCHA site key 無效或不匹配當前網域');
      log('   💡 解決方案: 檢查 Google reCAPTCHA 控制台中的 site key 和網域設定');
    } else if (errorMsg.includes('Network')) {
      log('   🔍 可能原因: 網路連接問題或 Google reCAPTCHA 服務無法訪問');
      log('   💡 解決方案: 檢查網路連接和防火牆設定');
    } else if (errorMsg.includes('Permission denied')) {
      log('   🔍 可能原因: CORS 或權限問題');
      log('   💡 解決方案: 檢查網域是否在 reCAPTCHA 允許清單中');
    }
    
    return false;
  }
}

/**
 * 診斷 App Check 完整狀態
 */
export function diagnoseAppCheck(): string {
  const timestamp = new Date().toISOString();
  const report: string[] = [];
  
  report.push(`=== App Check 診斷報告 [${timestamp}] ===`);
  report.push('');
  
  // 基本環境檢查
  report.push('🔍 環境檢查:');
  report.push(`   - 執行環境: ${typeof window !== 'undefined' ? '瀏覽器端' : '伺服器端'}`);
  if (typeof window !== 'undefined') {
    report.push(`   - 當前網址: ${window.location.href}`);
    report.push(`   - 網域: ${window.location.hostname}`);
    report.push(`   - 協議: ${window.location.protocol}`);
    report.push(`   - 線上狀態: ${navigator.onLine ? '線上' : '離線'}`);
  }
  report.push('');
  
  // App Check 狀態
  const status = getAppCheckStatus();
  report.push('🛡️ App Check 狀態:');
  report.push(`   - 已初始化: ${status.initialized ? '✅' : '❌'}`);
  report.push(`   - Site Key: ${status.siteKey}`);
  report.push(`   - 目標網域: ${status.currentDomain}`);
  report.push('');
  
  // reCAPTCHA 狀態
  report.push('🤖 reCAPTCHA 狀態:');
  report.push(`   - grecaptcha 存在: ${status.hasGrecaptcha ? '✅' : '❌'}`);
  report.push(`   - grecaptcha ready: ${status.grecaptchaReady ? '✅' : '❌'}`);
  report.push(`   - 可執行: ${status.canExecute ? '✅' : '❌'}`);
  
  if (typeof window !== 'undefined' && window.grecaptcha) {
    try {
      const props = Object.getOwnPropertyNames(window.grecaptcha);
      report.push(`   - 可用方法: [${props.join(', ')}]`);
    } catch (e) {
      report.push(`   - 無法檢查方法: ${String(e)}`);
    }
  }
  report.push('');
  
  // 建議檢查項目
  report.push('🔧 建議檢查項目:');
  if (!status.initialized) {
    report.push('   ❗ App Check 未初始化 - 先執行 initializeFirebaseAppCheck()');
  }
  if (!status.hasGrecaptcha) {
    report.push('   ❗ reCAPTCHA 未載入 - 檢查網頁是否包含 reCAPTCHA script 標籤');
  }
  if (status.currentDomain === 'localhost') {
    report.push('   ⚠️ 在 localhost 執行 - 確保 reCAPTCHA site key 允許 localhost 網域');
  }
  
  report.push('');
  report.push('📞 需要更多幫助？');
  report.push('   - 檢查 Firebase 控制台中的 App Check 設定');
  report.push('   - 檢查 Google reCAPTCHA 控制台中的網域設定');
  report.push('   - 確認 Firebase 專案已啟用 App Check');
  
  return report.join('\n');
}

/**
 * 強制重新初始化 App Check (清除快取)
 */
export async function forceReinitializeAppCheck(logger?: (message: string) => void): Promise<boolean> {
  const log = (message: string) => {
    const logMsg = logDetailed(message);
    if (logger) logger(logMsg);
    return logMsg;
  };

  try {
    log('🔄 強制重新初始化 App Check...');
    
    // 清除現有的 App Check 實例
    appCheck = null;
    log('   ✅ 已清除現有 App Check 實例');
    
    // 重新初始化
    await initializeFirebaseAppCheck(logger);
    log('   ✅ 重新初始化完成');
    
    // 等待一段時間讓 App Check 準備就緒
    log('   ⏳ 等待 App Check 準備就緒...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 嘗試取得 token
    const token = await getAppCheckToken(logger);
    if (token) {
      log('   ✅ 重新初始化後成功取得 token');
      return true;
    } else {
      log('   ❌ 重新初始化後仍無法取得 token');
      return false;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`❌ 強制重新初始化失敗: ${errorMsg}`);
    return false;
  }
}