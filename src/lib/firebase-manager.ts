import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck, getToken } from 'firebase/app-check';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';
import { getRemoteConfig } from 'firebase/remote-config';
import { getStorage } from 'firebase/storage';
import { firebaseConfig, APP_CHECK_CONFIG } from './firebase-config';

// 單例模式管理 Firebase 服務
class FirebaseManager {
  private static instance: FirebaseManager;
  private app: FirebaseApp;
  private auth: ReturnType<typeof getAuth>;
  private db: Firestore;
  private storage: ReturnType<typeof getStorage>;
  private functions: ReturnType<typeof getFunctions>;
  
  // 客戶端服務
  private analytics: ReturnType<typeof getAnalytics> | null = null;
  private performance: ReturnType<typeof getPerformance> | null = null;
  private remoteConfig: ReturnType<typeof getRemoteConfig> | null = null;
  private appCheck: AppCheck | null = null;
  
  // 狀態管理
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  
  // 認證狀態
  private currentUser: User | null = null;
  private authListeners: Array<(user: User | null) => void> = [];

  private constructor() {
    // 初始化 Firebase 應用
    this.app = initializeApp(firebaseConfig);
    
    // 初始化伺服器端安全服務
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.functions = getFunctions(this.app);
    
    // 設置認證狀態監聽
    this.setupAuthListener();
  }

  public static getInstance(): FirebaseManager {
    if (!FirebaseManager.instance) {
      FirebaseManager.instance = new FirebaseManager();
    }
    return FirebaseManager.instance;
  }

  /**
   * 初始化客戶端服務（只執行一次）
   */
  public async initializeClientServices(): Promise<void> {
    if (typeof window === 'undefined') {
      console.log('伺服器端環境，跳過客戶端服務初始化');
      return;
    }

    if (this.isInitialized) {
      console.log('客戶端服務已初始化');
      return;
    }

    if (this.isInitializing && this.initPromise) {
      console.log('客戶端服務正在初始化中，等待完成...');
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this.performInitialization();

    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('開始初始化 Firebase 客戶端服務...');

      // 1. 初始化 Analytics
      const analyticsSupported = await isAnalyticsSupported();
      if (analyticsSupported) {
        this.analytics = getAnalytics(this.app);
        console.log('Analytics 初始化完成');
      }

      // 2. 初始化 Performance
      if ('performance' in window) {
        this.performance = getPerformance(this.app);
        console.log('Performance 初始化完成');
      }

      // 3. 初始化 Remote Config
      this.remoteConfig = getRemoteConfig(this.app);
      console.log('Remote Config 初始化完成');

      // 4. 初始化 App Check
      this.appCheck = initializeAppCheck(this.app, {
        provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      console.log('App Check 初始化完成');

      this.isInitialized = true;
      console.log('所有 Firebase 客戶端服務初始化完成');
    } catch (error) {
      console.error('Firebase 客戶端服務初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 設置認證狀態監聽
   */
  private setupAuthListener(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      // 通知所有監聽器
      this.authListeners.forEach(listener => listener(user));
    });
  }

  /**
   * 添加認證狀態監聽器
   */
  public addAuthListener(listener: (user: User | null) => void): () => void {
    this.authListeners.push(listener);
    // 立即執行一次，提供當前狀態
    listener(this.currentUser);
    
    // 返回取消監聽的函數
    return () => {
      const index = this.authListeners.indexOf(listener);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  /**
   * 獲取 App Check Token
   */
  public async getAppCheckToken(forceRefresh = false): Promise<string | null> {
    if (!this.appCheck) {
      throw new Error('App Check 未初始化');
    }

    try {
      const tokenResult = await getToken(this.appCheck, forceRefresh);
      return tokenResult.token;
    } catch (error) {
      console.error('獲取 App Check Token 失敗:', error);
      throw error;
    }
  }

  /**
   * 檢查 App Check 是否有效
   */
  public async validateAppCheck(): Promise<boolean> {
    try {
      const token = await this.getAppCheckToken();
      return !!token;
    } catch {
      return false;
    }
  }

  // Getter 方法
  public getAuth() { return this.auth; }
  public getDb() { return this.db; }
  public getStorage() { return this.storage; }
  public getFunctions() { return this.functions; }
  public getAnalytics() { return this.analytics; }
  public getPerformance() { return this.performance; }
  public getRemoteConfig() { return this.remoteConfig; }
  public getAppCheck() { return this.appCheck; }
  public getCurrentUser() { return this.currentUser; }
  public isClientServicesInitialized() { return this.isInitialized; }
}

// 導出單例實例
export const firebaseManager = FirebaseManager.getInstance();

// 導出類型
export type { FirebaseManager }; 