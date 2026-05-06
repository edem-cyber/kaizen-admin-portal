/**
 * Cookie Utilities
 * 
 * A comprehensive cookie management system for handling:
 * - Cookie consent (GDPR/CCPA compliant)
 * - Analytics tracking
 * - Security features (CSRF, trusted devices)
 * - User preferences
 */

export interface CookieOptions {
  /** Number of days until expiration */
  days?: number;
  /** Path for the cookie */
  path?: string;
  /** Domain for the cookie */
  domain?: string;
  /** Only send over HTTPS */
  secure?: boolean;
  /** HttpOnly flag (set server-side only) */
  httpOnly?: boolean;
  /** SameSite attribute */
  sameSite?: 'strict' | 'lax' | 'none';
}

const DEFAULT_OPTIONS: CookieOptions = {
  days: 365,
  path: '/',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  sameSite: 'lax',
};

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const expires = new Date(Date.now() + (opts.days || 365) * 24 * 60 * 60 * 1000);
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookieString += `; expires=${expires.toUTCString()}`;
  cookieString += `; path=${opts.path || '/'}`;
  
  if (opts.domain) {
    cookieString += `; domain=${opts.domain}`;
  }
  
  if (opts.secure) {
    cookieString += '; secure';
  }
  
  if (opts.sameSite) {
    cookieString += `; samesite=${opts.sameSite}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;

  const opts = { ...DEFAULT_OPTIONS, ...options, days: -1 };
  setCookie(name, '', opts);
}

/**
 * Check if cookies are enabled in the browser
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    const testKey = '__cookie_test__';
    setCookie(testKey, '1');
    const result = getCookie(testKey) === '1';
    deleteCookie(testKey);
    return result;
  } catch {
    return false;
  }
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const pairs = document.cookie.split(';');
  
  for (const pair of pairs) {
    const [name, value] = pair.trim().split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }
  
  return cookies;
}

/**
 * Parse a JSON cookie value
 */
export function getJSONCookie<T>(name: string): T | null {
  const value = getCookie(name);
  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Set a JSON cookie value
 */
export function setJSONCookie<T>(name: string, value: T, options: CookieOptions = {}): void {
  setCookie(name, JSON.stringify(value), options);
}