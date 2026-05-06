/**
 * Analytics Tracking Module
 * 
 * Provides analytics tracking functionality that respects user consent
 * Ready for Firebase Analytics integration
 */

import { getCookie, setCookie, getJSONCookie, setJSONCookie, deleteCookie } from './utils';
import { useConsentStore } from './consent-store';
import {
  COOKIE_NAMES,
  SESSION_TIMEOUT_MINUTES,
  type AnalyticsEvent,
  type AnalyticsEventType,
} from './types';

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

interface SessionData {
  sessionId: string;
  userId?: string;
  startedAt: string;
  lastActivityAt: string;
  pageViews: number;
}

/**
 * Generate a unique ID (using a simple implementation without uuid dependency)
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get or create analytics session
 */
function getSession(): SessionData | null {
  // Check if analytics is allowed
  const status = useConsentStore.getState().status;
  if (!status.analytics) return null;

  const existingSession = getJSONCookie<SessionData>(COOKIE_NAMES.ANALYTICS_SESSION);
  const now = new Date();
  
  if (existingSession) {
    // Check if session has expired
    const lastActivity = new Date(existingSession.lastActivityAt);
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    
    if (minutesSinceActivity < SESSION_TIMEOUT_MINUTES) {
      // Update last activity
      existingSession.lastActivityAt = now.toISOString();
      setJSONCookie(COOKIE_NAMES.ANALYTICS_SESSION, existingSession, { days: 1 });
      return existingSession;
    }
  }
  
  // Create new session
  const newSession: SessionData = {
    sessionId: generateId(),
    startedAt: now.toISOString(),
    lastActivityAt: now.toISOString(),
    pageViews: 0,
  };
  
  setJSONCookie(COOKIE_NAMES.ANALYTICS_SESSION, newSession, { days: 1 });
  return newSession;
}

/**
 * Get or create anonymous user ID
 */
function getUserId(): string {
  let userId = getCookie(COOKIE_NAMES.ANALYTICS_USER);
  
  if (!userId) {
    userId = generateId();
    setCookie(COOKIE_NAMES.ANALYTICS_USER, userId, { days: 365 });
  }
  
  return userId;
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

interface PageViewData {
  path: string;
  title: string;
  referrer?: string;
  timestamp: string;
  sessionId: string;
}

interface FeatureUsageData {
  feature: string;
  action: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface PerformanceData {
  metric: string;
  value: number;
  path: string;
  timestamp: string;
}

interface ErrorData {
  type: 'javascript' | 'api' | 'network';
  message: string;
  stack?: string;
  path: string;
  timestamp: string;
}

// Store for queued events (to be sent to analytics backend)
const eventQueue: AnalyticsEvent[] = [];

/**
 * Track a page view
 */
export function trackPageView(path: string, title: string): void {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return;

  const session = getSession();
  if (!session) return;

  const event: AnalyticsEvent = {
    type: 'page_view',
    name: 'page_view',
    timestamp: new Date().toISOString(),
    properties: {
      path,
      title,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    },
    page: {
      path,
      title,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    },
    session: {
      id: session.sessionId,
      isNew: session.pageViews === 0,
    },
  };

  // Update session page views
  session.pageViews += 1;
  setJSONCookie(COOKIE_NAMES.ANALYTICS_SESSION, session, { days: 1 });

  // Queue event
  eventQueue.push(event);
  
  // Update page views cookie
  const pageViews = getJSONCookie<PageViewData[]>(COOKIE_NAMES.PAGE_VIEWS) || [];
  pageViews.push({
    path,
    title,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    timestamp: event.timestamp,
    sessionId: session.sessionId,
  });
  
  // Keep only last 50 page views
  if (pageViews.length > 50) {
    pageViews.shift();
  }
  
  setJSONCookie(COOKIE_NAMES.PAGE_VIEWS, pageViews, { days: 7 });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Page View:', event);
  }
}

/**
 * Track a feature usage
 */
export function trackFeatureUse(
  feature: string, 
  action: string, 
  metadata?: Record<string, unknown>
): void {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return;

  const session = getSession();
  if (!session) return;

  const event: AnalyticsEvent = {
    type: 'feature_use',
    name: `${feature}_${action}`,
    timestamp: new Date().toISOString(),
    properties: {
      feature,
      action,
      ...metadata,
    },
    page: {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : '',
    },
    session: {
      id: session.sessionId,
      isNew: false,
    },
  };

  eventQueue.push(event);

  // Update feature usage cookie
  const featureUsage = getJSONCookie<FeatureUsageData[]>(COOKIE_NAMES.FEATURE_USAGE) || [];
  featureUsage.push({
    feature,
    action,
    metadata,
    timestamp: event.timestamp,
  });
  
  // Keep only last 100 feature usages
  if (featureUsage.length > 100) {
    featureUsage.shift();
  }
  
  setJSONCookie(COOKIE_NAMES.FEATURE_USAGE, featureUsage, { days: 7 });

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Feature Use:', event);
  }
}

/**
 * Track a button click
 */
export function trackButtonClick(buttonName: string, context?: string): void {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return;

  const session = getSession();
  if (!session) return;

  const event: AnalyticsEvent = {
    type: 'button_click',
    name: buttonName,
    timestamp: new Date().toISOString(),
    properties: {
      buttonName,
      context,
    },
    page: {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : '',
    },
    session: {
      id: session.sessionId,
      isNew: false,
    },
  };

  eventQueue.push(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Button Click:', event);
  }
}

/**
 * Track a form submission
 */
export function trackFormSubmit(formName: string, success: boolean, metadata?: Record<string, unknown>): void {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return;

  const session = getSession();
  if (!session) return;

  const event: AnalyticsEvent = {
    type: success ? 'form_submit' : 'form_error',
    name: formName,
    timestamp: new Date().toISOString(),
    properties: {
      formName,
      success,
      ...metadata,
    },
    page: {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : '',
    },
    session: {
      id: session.sessionId,
      isNew: false,
    },
  };

  eventQueue.push(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Form Submit:', event);
  }
}

/**
 * Track a search
 */
export function trackSearch(query: string, resultsCount?: number, filters?: Record<string, unknown>): void {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return;

  const session = getSession();
  if (!session) return;

  const event: AnalyticsEvent = {
    type: 'search',
    name: 'search',
    timestamp: new Date().toISOString(),
    properties: {
      query,
      resultsCount,
      filters,
    },
    page: {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : '',
    },
    session: {
      id: session.sessionId,
      isNew: false,
    },
  };

  eventQueue.push(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Search:', event);
  }
}

/**
 * Track an error
 */
export function trackError(type: 'javascript' | 'api' | 'network', message: string, stack?: string): void {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return;

  const session = getSession();
  if (!session) return;

  const event: AnalyticsEvent = {
    type: 'error',
    name: `${type}_error`,
    timestamp: new Date().toISOString(),
    properties: {
      errorType: type,
      message,
      stack,
    },
    page: {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : '',
    },
    session: {
      id: session.sessionId,
      isNew: false,
    },
  };

  eventQueue.push(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Error:', event);
  }
}

/**
 * Track performance metrics
 */
export function trackPerformance(metric: string, value: number): void {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return;

  const session = getSession();
  if (!session) return;

  const event: AnalyticsEvent = {
    type: 'performance',
    name: metric,
    timestamp: new Date().toISOString(),
    properties: {
      metric,
      value,
    },
    page: {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : '',
    },
    session: {
      id: session.sessionId,
      isNew: false,
    },
  };

  eventQueue.push(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Performance:', event);
  }
}

/**
 * Track user authentication events
 */
export function trackAuthEvent(event: 'login' | 'logout' | 'signup', method?: string): void {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return;

  const session = getSession();
  if (!session) return;

  const analyticsEvent: AnalyticsEvent = {
    type: event === 'login' ? 'user_login' : event === 'logout' ? 'user_logout' : 'user_login',
    name: event,
    timestamp: new Date().toISOString(),
    properties: {
      event,
      method,
    },
    page: {
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      title: typeof document !== 'undefined' ? document.title : '',
    },
    session: {
      id: session.sessionId,
      isNew: event === 'signup',
    },
  };

  eventQueue.push(analyticsEvent);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Auth Event:', analyticsEvent);
  }
}

// ============================================================================
// DATA RETRIEVAL
// ============================================================================

/**
 * Get all queued events (for sending to backend)
 */
export function getEventQueue(): AnalyticsEvent[] {
  return [...eventQueue];
}

/**
 * Clear the event queue
 */
export function clearEventQueue(): void {
  eventQueue.length = 0;
}

/**
 * Get page views data
 */
export function getPageViews(): PageViewData[] {
  return getJSONCookie<PageViewData[]>(COOKIE_NAMES.PAGE_VIEWS) || [];
}

/**
 * Get feature usage data
 */
export function getFeatureUsage(): FeatureUsageData[] {
  return getJSONCookie<FeatureUsageData[]>(COOKIE_NAMES.FEATURE_USAGE) || [];
}

/**
 * Get current session info
 */
export function getCurrentSession(): SessionData | null {
  return getSession();
}

/**
 * Get anonymous user ID
 */
export function getAnalyticsUserId(): string | null {
  const status = useConsentStore.getState().status;
  if (!status.analytics) return null;
  return getUserId();
}

/**
 * Clear all analytics data
 */
export function clearAnalyticsData(): void {
  deleteCookie(COOKIE_NAMES.ANALYTICS_SESSION);
  deleteCookie(COOKIE_NAMES.ANALYTICS_USER);
  deleteCookie(COOKIE_NAMES.PAGE_VIEWS);
  deleteCookie(COOKIE_NAMES.FEATURE_USAGE);
  clearEventQueue();
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useCallback, useEffect } from 'react';

/**
 * Hook for analytics tracking
 */
export function useAnalytics() {
  const isAnalyticsAllowed = useConsentStore((state) => state.status.analytics);

  const trackPageViewFn = useCallback((path: string, title: string) => {
    if (isAnalyticsAllowed) {
      trackPageView(path, title);
    }
  }, [isAnalyticsAllowed]);

  const trackFeatureUseFn = useCallback((
    feature: string, 
    action: string, 
    metadata?: Record<string, unknown>
  ) => {
    if (isAnalyticsAllowed) {
      trackFeatureUse(feature, action, metadata);
    }
  }, [isAnalyticsAllowed]);

  const trackButtonClickFn = useCallback((buttonName: string, context?: string) => {
    if (isAnalyticsAllowed) {
      trackButtonClick(buttonName, context);
    }
  }, [isAnalyticsAllowed]);

  const trackFormSubmitFn = useCallback((
    formName: string, 
    success: boolean, 
    metadata?: Record<string, unknown>
  ) => {
    if (isAnalyticsAllowed) {
      trackFormSubmit(formName, success, metadata);
    }
  }, [isAnalyticsAllowed]);

  const trackSearchFn = useCallback((
    query: string, 
    resultsCount?: number, 
    filters?: Record<string, unknown>
  ) => {
    if (isAnalyticsAllowed) {
      trackSearch(query, resultsCount, filters);
    }
  }, [isAnalyticsAllowed]);

  const trackErrorFn = useCallback((
    type: 'javascript' | 'api' | 'network', 
    message: string, 
    stack?: string
  ) => {
    if (isAnalyticsAllowed) {
      trackError(type, message, stack);
    }
  }, [isAnalyticsAllowed]);

  const trackPerformanceFn = useCallback((metric: string, value: number) => {
    if (isAnalyticsAllowed) {
      trackPerformance(metric, value);
    }
  }, [isAnalyticsAllowed]);

  return {
    isAnalyticsAllowed,
    trackPageView: trackPageViewFn,
    trackFeatureUse: trackFeatureUseFn,
    trackButtonClick: trackButtonClickFn,
    trackFormSubmit: trackFormSubmitFn,
    trackSearch: trackSearchFn,
    trackError: trackErrorFn,
    trackPerformance: trackPerformanceFn,
  };
}

/**
 * Hook for automatic page view tracking
 */
export function usePageTracking(path: string, title: string) {
  const isAnalyticsAllowed = useConsentStore((state) => state.status.analytics);

  useEffect(() => {
    if (isAnalyticsAllowed) {
      trackPageView(path, title);
    }
  }, [path, title, isAnalyticsAllowed]);
}