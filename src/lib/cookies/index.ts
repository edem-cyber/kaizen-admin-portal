/**
 * Cookie Module - Main Entry Point
 * 
 * Exports all cookie-related functionality including:
 * - Cookie utilities
 * - Consent management
 * - Analytics tracking
 * - Security features
 */

// ============================================================================
// UTILITIES
// ============================================================================

export {
  setCookie,
  getCookie,
  deleteCookie,
  areCookiesEnabled,
  getAllCookies,
  getJSONCookie,
  setJSONCookie,
  type CookieOptions,
} from './utils';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export {
  COOKIE_CATEGORIES,
  DEFAULT_CONSENT_STATUS,
  COOKIE_NAMES,
  CONSENT_POLICY_VERSION,
  CONSENT_EXPIRATION_DAYS,
  SESSION_TIMEOUT_MINUTES,
  TRUSTED_DEVICE_EXPIRATION_DAYS,
  CSRF_TOKEN_EXPIRATION_HOURS,
  type CookieCategory,
  type CookieCategoryConfig,
  type ConsentStatus,
  type ConsentRecord,
  type AnalyticsEvent,
  type AnalyticsEventType,
  type CSRFToken,
  type TrustedDevice,
} from './types';

// ============================================================================
// CONSENT STORE
// ============================================================================

export { useConsentStore } from './consent-store';

// ============================================================================
// ANALYTICS
// ============================================================================

export {
  useAnalytics,
  usePageTracking,
  trackPageView,
  trackFeatureUse,
  trackButtonClick,
  trackFormSubmit,
  trackSearch,
  trackError,
  trackPerformance,
  trackAuthEvent,
  getEventQueue,
  clearEventQueue,
  getPageViews,
  getFeatureUsage,
  getCurrentSession,
  getAnalyticsUserId,
  clearAnalyticsData,
} from './analytics';

// ============================================================================
// SECURITY
// ============================================================================

export {
  useCSRF,
  useTrustedDevices,
  getCSRFToken,
  generateCSRFToken,
  validateCSRFToken,
  refreshCSRFTokenIfNeeded,
  getOrCreateCSRFToken,
  clearCSRFToken,
  getTrustedDevices,
  isCurrentDeviceTrusted,
  getCurrentDeviceTrust,
  trustCurrentDevice,
  removeTrustedDevice,
  clearAllTrustedDevices,
  updateTrustedDeviceName,
  getSecurityHeaders,
  verifyOrigin,
} from './security';