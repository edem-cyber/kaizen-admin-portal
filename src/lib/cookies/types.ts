/**
 * Cookie Consent Types and Constants
 * 
 * Defines the structure for GDPR/CCPA compliant cookie consent management
 */

// ============================================================================
// COOKIE CATEGORIES
// ============================================================================

/**
 * Cookie categories as per GDPR guidelines
 */
export type CookieCategory = 
  | 'essential'      // Required for basic site functionality
  | 'functional'     // Enhanced functionality (preferences, settings)
  | 'analytics'      // Analytics and performance tracking
  | 'marketing';     // Marketing and advertising

/**
 * Cookie category configuration
 */
export interface CookieCategoryConfig {
  id: CookieCategory;
  name: string;
  description: string;
  required: boolean;  // Cannot be disabled (for essential cookies)
  cookies: string[];  // List of cookie names in this category
}

/**
 * All cookie category configurations
 */
export const COOKIE_CATEGORIES: Record<CookieCategory, CookieCategoryConfig> = {
  essential: {
    id: 'essential',
    name: 'Essential Cookies',
    description: 'Required for the website to function properly. These cannot be disabled.',
    required: true,
    cookies: [
      'csrf_token',
      'session_data',
      'cookie_consent',
      'trusted_device',
    ],
  },
  functional: {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'Remember your preferences and settings to provide enhanced functionality.',
    required: false,
    cookies: [
      'theme_preference',
      'sidebar_state',
      'language_preference',
      'table_preferences',
      'last_visited_page',
    ],
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'Help us understand how visitors interact with our website by collecting anonymous information.',
    required: false,
    cookies: [
      'analytics_session_id',
      'analytics_user_id',
      'page_views',
      'feature_usage',
      'performance_metrics',
    ],
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'Used to track visitors across websites for advertising purposes.',
    required: false,
    cookies: [
      'ad_preferences',
      'marketing_tokens',
    ],
  },
} as const;

// ============================================================================
// CONSENT STATE
// ============================================================================

/**
 * Consent status for each category
 */
export type ConsentStatus = Record<CookieCategory, boolean>;

/**
 * Full consent record
 */
export interface ConsentRecord {
  /** Unique identifier for this consent record */
  id: string;
  /** Consent status for each category */
  status: ConsentStatus;
  /** When consent was given */
  timestamp: string;
  /** Version of the consent policy */
  version: string;
  /** User agent string */
  userAgent: string;
  /** IP address (if available, usually set server-side) */
  ipAddress?: string;
  /** How consent was given (banner, settings page, etc.) */
  source: 'banner' | 'settings' | 'api';
}

/**
 * Default consent status (only essential enabled)
 */
export const DEFAULT_CONSENT_STATUS: ConsentStatus = {
  essential: true,    // Always true
  functional: false,
  analytics: false,
  marketing: false,
};

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

/**
 * Analytics event types
 */
export type AnalyticsEventType = 
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'form_error'
  | 'feature_use'
  | 'search'
  | 'filter_apply'
  | 'item_create'
  | 'item_update'
  | 'item_delete'
  | 'user_login'
  | 'user_logout'
  | 'error'
  | 'performance';

/**
 * Analytics event structure
 */
export interface AnalyticsEvent {
  /** Event type */
  type: AnalyticsEventType;
  /** Event name/action */
  name: string;
  /** Timestamp */
  timestamp: string;
  /** Event properties/metadata */
  properties: Record<string, unknown>;
  /** Page information */
  page: {
    path: string;
    title: string;
    referrer?: string;
  };
  /** Session information */
  session: {
    id: string;
    isNew: boolean;
  };
}

// ============================================================================
// SECURITY
// ============================================================================

/**
 * CSRF token structure
 */
export interface CSRFToken {
  token: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Trusted device information
 */
export interface TrustedDevice {
  id: string;
  name: string;
  userAgent: string;
  platform: string;
  addedAt: string;
  expiresAt: string;
  lastUsedAt: string;
}

// ============================================================================
// COOKIE NAMES
// ============================================================================

export const COOKIE_NAMES = {
  // Consent
  CONSENT: 'cookie_consent',
  CONSENT_VERSION: 'consent_version',
  
  // Security
  CSRF_TOKEN: 'csrf_token',
  TRUSTED_DEVICE: 'trusted_device',
  
  // Preferences
  THEME: 'theme_preference',
  SIDEBAR_STATE: 'sidebar_state',
  LANGUAGE: 'language_preference',
  TABLE_PREFS: 'table_preferences',
  LAST_PAGE: 'last_visited_page',
  
  // Analytics
  ANALYTICS_SESSION: 'analytics_session_id',
  ANALYTICS_USER: 'analytics_user_id',
  PAGE_VIEWS: 'page_views',
  FEATURE_USAGE: 'feature_usage',
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Current consent policy version
 */
export const CONSENT_POLICY_VERSION = '1.0.0';

/**
 * Consent cookie expiration in days
 */
export const CONSENT_EXPIRATION_DAYS = 365;

/**
 * Session timeout in minutes
 */
export const SESSION_TIMEOUT_MINUTES = 30;

/**
 * Trusted device expiration in days
 */
export const TRUSTED_DEVICE_EXPIRATION_DAYS = 30;

/**
 * CSRF token expiration in hours
 */
export const CSRF_TOKEN_EXPIRATION_HOURS = 24;