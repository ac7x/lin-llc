import { getPerformance, trace } from 'firebase/performance';
import type { FirebasePerformance } from 'firebase/performance';
import { firebaseApp } from './firebase-client';

let firebasePerformance: FirebasePerformance | null = null;

export function initializePerformance(): FirebasePerformance | null {
  if (typeof window === 'undefined') return null;
  if (firebasePerformance) return firebasePerformance;
  firebasePerformance = getPerformance(firebaseApp);
  return firebasePerformance;
}

export function getPerformanceInstance(): FirebasePerformance | null {
  return firebasePerformance ?? initializePerformance();
}

export function createTrace(traceName: string) {
  const perf = getPerformanceInstance();
  if (!perf) return null;
  return trace(perf, traceName);
}

export function measurePageLoad(pageName: string) {
  const pageTrace = createTrace(`page_load_${pageName}`);
  if (!pageTrace) return null;
  pageTrace.start();
  if (document.readyState === 'complete') {
    pageTrace.stop();
  } else {
    window.addEventListener('load', () => pageTrace.stop());
  }
  return pageTrace;
}

export function measureApiCall(apiName: string, method: string = 'GET') {
  const apiTrace = createTrace(`api_call_${apiName}_${method.toLowerCase()}`);
  if (!apiTrace) return null;
  apiTrace.start();
  return {
    trace: apiTrace,
    stop: () => apiTrace.stop(),
    addAttribute: (name: string, value: string) => apiTrace.putAttribute(name, value),
  };
}

export function measureDatabaseOperation(operation: string, collection?: string) {
  const operationName = collection ? `db_${operation}_${collection}` : `db_${operation}`;
  const dbTrace = createTrace(operationName);
  if (!dbTrace) return null;
  dbTrace.start();
  return {
    trace: dbTrace,
    stop: () => dbTrace.stop(),
    addAttribute: (name: string, value: string) => dbTrace.putAttribute(name, value),
  };
}

export function measureFileUpload(fileName: string) {
  const uploadTrace = createTrace(`file_upload_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`);
  if (!uploadTrace) return null;
  uploadTrace.start();
  return {
    trace: uploadTrace,
    stop: () => uploadTrace.stop(),
    addMetric: (metricName: string, value: number) => uploadTrace.putMetric(metricName, value),
    addAttribute: (name: string, value: string) => uploadTrace.putAttribute(name, value),
  };
}

export function measureComponentRender(componentName: string) {
  const renderTrace = createTrace(`component_render_${componentName}`);
  if (!renderTrace) return null;
  renderTrace.start();
  return {
    trace: renderTrace,
    stop: () => renderTrace.stop(),
    addAttribute: (name: string, value: string) => renderTrace.putAttribute(name, value),
  };
}

export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;
  private traceName: string;
  private trace: any;

  constructor(traceName: string) {
    this.traceName = traceName;
    this.startTime = window.performance.now();
    this.trace = createTrace(traceName);
    if (this.trace) this.trace.start();
  }

  stop(): number {
    this.endTime = window.performance.now();
    const duration = this.endTime - this.startTime;
    if (this.trace) {
      this.trace.putMetric('duration_ms', Math.round(duration));
      this.trace.stop();
    }
    return duration;
  }

  addAttribute(name: string, value: string) {
    if (this.trace) this.trace.putAttribute(name, value);
  }

  addMetric(name: string, value: number) {
    if (this.trace) this.trace.putMetric(name, value);
  }
}

export function withPerformanceTracking<T extends (...args: any[]) => any>(fn: T, traceName: string): T {
  return ((...args: any[]) => {
    const timer = new PerformanceTimer(traceName);
    const result = fn(...args);
    if (result instanceof Promise) {
      return result.finally(() => timer.stop());
    } else {
      timer.stop();
      return result;
    }
  }) as T;
}

export function setupWebVitalsTracking() {
  const perf = getPerformanceInstance();
  if (!perf) return;
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
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
}

if (typeof window !== 'undefined') {
  initializePerformance();
  setupWebVitalsTracking();
}