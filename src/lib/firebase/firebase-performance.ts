import { getPerformance, trace } from 'firebase/performance';
import type { FirebasePerformance } from 'firebase/performance';
import { firebaseApp } from './firebase-client';

let firebasePerformance: FirebasePerformance | null = null;

/**
 * 初始化 Firebase Performance Monitoring
 */
export function initializePerformance(): FirebasePerformance | null {
  try {
    // 檢查瀏覽器環境
    if (typeof window === 'undefined') {
      console.warn('Firebase Performance is only available in browser environment');
      return null;
    }

    // 檢查是否已初始化
    if (firebasePerformance) {
      return firebasePerformance;
    }

    // 初始化 Performance
    firebasePerformance = getPerformance(firebaseApp);

    // 在開發環境中可以進行額外設定（暫時移除模擬器連接，因為 SDK 可能不支援）
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Firebase Performance initialized in development mode');
    }

    console.log('📊 Firebase Performance initialized successfully');
    return firebasePerformance;
  } catch (error) {
    console.error('Failed to initialize Firebase Performance:', error);
    return null;
  }
}

/**
 * 取得 Performance 實例
 */
export function getPerformanceInstance(): FirebasePerformance | null {
  if (!firebasePerformance) {
    return initializePerformance();
  }
  return firebasePerformance;
}

/**
 * 建立自定義性能追蹤
 */
export function createTrace(traceName: string) {
  try {
    const perf = getPerformanceInstance();
    if (!perf) {
      console.warn('Performance not available, trace will not be recorded');
      return null;
    }

    const customTrace = trace(perf, traceName);
    return customTrace;
  } catch (error) {
    console.error(`Failed to create trace "${traceName}":`, error);
    return null;
  }
}

/**
 * 測量頁面載入性能
 */
export function measurePageLoad(pageName: string) {
  try {
    const pageTrace = createTrace(`page_load_${pageName}`);
    if (!pageTrace) return null;

    pageTrace.start();

    // 在頁面載入完成時停止追蹤
    if (document.readyState === 'complete') {
      pageTrace.stop();
    } else {
      window.addEventListener('load', () => {
        pageTrace.stop();
      });
    }

    return pageTrace;
  } catch (error) {
    console.error(`Failed to measure page load for "${pageName}":`, error);
    return null;
  }
}

/**
 * 測量 API 呼叫性能
 */
export function measureApiCall(apiName: string, method: string = 'GET') {
  try {
    const apiTrace = createTrace(`api_call_${apiName}_${method.toLowerCase()}`);
    if (!apiTrace) return null;

    apiTrace.start();
    return {
      trace: apiTrace,
      stop: () => apiTrace.stop(),
      addAttribute: (name: string, value: string) => {
        try {
          apiTrace.putAttribute(name, value);
        } catch (error) {
          console.warn(`Failed to add attribute "${name}" to trace:`, error);
        }
      }
    };
  } catch (error) {
    console.error(`Failed to measure API call "${apiName}":`, error);
    return null;
  }
}

/**
 * 測量資料庫操作性能
 */
export function measureDatabaseOperation(operation: string, collection?: string) {
  try {
    const operationName = collection ? `db_${operation}_${collection}` : `db_${operation}`;
    const dbTrace = createTrace(operationName);
    if (!dbTrace) return null;

    dbTrace.start();
    return {
      trace: dbTrace,
      stop: () => dbTrace.stop(),
      addAttribute: (name: string, value: string) => {
        try {
          dbTrace.putAttribute(name, value);
        } catch (error) {
          console.warn(`Failed to add attribute "${name}" to trace:`, error);
        }
      }
    };
  } catch (error) {
    console.error(`Failed to measure database operation "${operation}":`, error);
    return null;
  }
}

/**
 * 測量檔案上傳性能
 */
export function measureFileUpload(fileName: string) {
  try {
    const uploadTrace = createTrace(`file_upload_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (!uploadTrace) return null;

    uploadTrace.start();
    return {
      trace: uploadTrace,
      stop: () => uploadTrace.stop(),
      addMetric: (metricName: string, value: number) => {
        try {
          uploadTrace.putMetric(metricName, value);
        } catch (error) {
          console.warn(`Failed to add metric "${metricName}" to trace:`, error);
        }
      },
      addAttribute: (name: string, value: string) => {
        try {
          uploadTrace.putAttribute(name, value);
        } catch (error) {
          console.warn(`Failed to add attribute "${name}" to trace:`, error);
        }
      }
    };
  } catch (error) {
    console.error(`Failed to measure file upload "${fileName}":`, error);
    return null;
  }
}

/**
 * 測量元件渲染性能
 */
export function measureComponentRender(componentName: string) {
  try {
    const renderTrace = createTrace(`component_render_${componentName}`);
    if (!renderTrace) return null;

    renderTrace.start();
    return {
      trace: renderTrace,
      stop: () => renderTrace.stop(),
      addAttribute: (name: string, value: string) => {
        try {
          renderTrace.putAttribute(name, value);
        } catch (error) {
          console.warn(`Failed to add attribute "${name}" to trace:`, error);
        }
      }
    };
  } catch (error) {
    console.error(`Failed to measure component render "${componentName}":`, error);
    return null;
  }
}

/**
 * 通用性能計時器
 */
export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;
  private traceName: string;
  private trace: any;

  constructor(traceName: string) {
    this.traceName = traceName;
    this.startTime = window.performance.now();
    this.trace = createTrace(traceName);
    if (this.trace) {
      this.trace.start();
    }
  }

  stop(): number {
    this.endTime = window.performance.now();
    const duration = this.endTime - this.startTime;
    
    if (this.trace) {
      this.trace.putMetric('duration_ms', Math.round(duration));
      this.trace.stop();
    }

    console.log(`⏱️ ${this.traceName}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  addAttribute(name: string, value: string) {
    if (this.trace) {
      try {
        this.trace.putAttribute(name, value);
      } catch (error) {
        console.warn(`Failed to add attribute "${name}" to timer:`, error);
      }
    }
  }

  addMetric(name: string, value: number) {
    if (this.trace) {
      try {
        this.trace.putMetric(name, value);
      } catch (error) {
        console.warn(`Failed to add metric "${name}" to timer:`, error);
      }
    }
  }
}

/**
 * 測量函數執行時間的裝飾器
 */
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  traceName: string
): T {
  return ((...args: any[]) => {
    const timer = new PerformanceTimer(traceName);
    
    try {
      const result = fn(...args);
      
      // 如果是 Promise，等待完成後停止計時
      if (result instanceof Promise) {
        return result.finally(() => timer.stop());
      } else {
        timer.stop();
        return result;
      }
    } catch (error) {
      timer.addAttribute('error', 'true');
      timer.stop();
      throw error;
    }
  }) as T;
}

/**
 * 初始化網頁性能監控
 */
export function setupWebVitalsTracking() {
  try {
    const perf = getPerformanceInstance();
    if (!perf) return;

    // 監控 Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // 監控 Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const lcpTrace = createTrace('web_vitals_lcp');
          if (lcpTrace) {
            lcpTrace.start();
            lcpTrace.putMetric('lcp_time', Math.round(entry.startTime));
            lcpTrace.stop();
          }
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // 監控 First Input Delay (FID)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidTrace = createTrace('web_vitals_fid');
          if (fidTrace) {
            fidTrace.start();
            fidTrace.putMetric('fid_time', Math.round((entry as any).processingStart - entry.startTime));
            fidTrace.stop();
          }
        }
      }).observe({ entryTypes: ['first-input'] });

      // 監控 Cumulative Layout Shift (CLS)
      new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (clsValue > 0) {
          const clsTrace = createTrace('web_vitals_cls');
          if (clsTrace) {
            clsTrace.start();
            clsTrace.putMetric('cls_score', Math.round(clsValue * 1000) / 1000);
            clsTrace.stop();
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    }
  } catch (error) {
    console.error('Failed to setup Web Vitals tracking:', error);
  }
}

// 自動初始化（在瀏覽器環境中）
if (typeof window !== 'undefined') {
  initializePerformance();
  setupWebVitalsTracking();
}