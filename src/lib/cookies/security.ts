/**
 * Security Module
 * 
 * Provides CSRF protection and trusted device management
 */

import { getCookie, setCookie, getJSONCookie, setJSONCookie, deleteCookie } from './utils';
import { COOKIE_NAMES, CSRF_TOKEN_EXPIRATION_HOURS, TRUSTED_DEVICE_EXPIRATION_DAYS, type CSRFToken, type TrustedDevice } from './types';

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments without crypto API
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get the current CSRF token
 */
export function getCSRFToken(): CSRFToken | null {
  return getJSONCookie<CSRFToken>(COOKIE_NAMES.CSRF_TOKEN);
}

/**
 * Generate and store a new CSRF token
 */
export function generateCSRFToken(): CSRFToken {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CSRF_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);
  
  const token: CSRFToken = {
    token: generateToken(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  
  setJSONCookie(COOKIE_NAMES.CSRF_TOKEN, token, { 
    days: CSRF_TOKEN_EXPIRATION_HOURS / 24,
    sameSite: 'strict',
  });
  
  return token;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(tokenToValidate: string): boolean {
  const storedToken = getCSRFToken();
  
  if (!storedToken) {
    return false;
  }
  
  // Check if token matches
  if (storedToken.token !== tokenToValidate) {
    return false;
  }
  
  // Check if token has expired
  const expiresAt = new Date(storedToken.expiresAt);
  if (expiresAt < new Date()) {
    deleteCookie(COOKIE_NAMES.CSRF_TOKEN);
    return false;
  }
  
  return true;
}

/**
 * Refresh CSRF token if it's about to expire (within 1 hour)
 */
export function refreshCSRFTokenIfNeeded(): CSRFToken {
  const storedToken = getCSRFToken();
  
  if (!storedToken) {
    return generateCSRFToken();
  }
  
  const expiresAt = new Date(storedToken.expiresAt);
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  
  if (expiresAt < oneHourFromNow) {
    return generateCSRFToken();
  }
  
  return storedToken;
}

/**
 * Get CSRF token for use in forms/requests
 * Creates a new one if none exists
 */
export function getOrCreateCSRFToken(): string {
  let token = getCSRFToken();
  
  if (!token || new Date(token.expiresAt) < new Date()) {
    token = generateCSRFToken();
  }
  
  return token.token;
}

/**
 * Clear CSRF token
 */
export function clearCSRFToken(): void {
  deleteCookie(COOKIE_NAMES.CSRF_TOKEN);
}

// ============================================================================
// TRUSTED DEVICES
// ============================================================================

/**
 * Get device information
 */
function getDeviceInfo(): { name: string; platform: string; userAgent: string } {
  if (typeof navigator === 'undefined') {
    return {
      name: 'Unknown Device',
      platform: 'Unknown',
      userAgent: '',
    };
  }
  
  const ua = navigator.userAgent;
  let name = 'Unknown Device';
  let platform = navigator.platform || 'Unknown';
  
  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    name = 'Chrome';
  } else if (ua.includes('Firefox')) {
    name = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
  } else if (ua.includes('Edg')) {
    name = 'Edge';
  }
  
  // Detect OS
  if (ua.includes('Windows')) {
    platform = 'Windows';
  } else if (ua.includes('Mac')) {
    platform = 'macOS';
  } else if (ua.includes('Linux')) {
    platform = 'Linux';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    platform = 'iOS';
  } else if (ua.includes('Android')) {
    platform = 'Android';
  }
  
  name = `${name} on ${platform}`;
  
  return { name, platform, userAgent: ua };
}

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get all trusted devices
 */
export function getTrustedDevices(): TrustedDevice[] {
  return getJSONCookie<TrustedDevice[]>(COOKIE_NAMES.TRUSTED_DEVICE) || [];
}

/**
 * Check if current device is trusted
 */
export function isCurrentDeviceTrusted(): boolean {
  const devices = getTrustedDevices();
  const currentUA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const now = new Date();
  
  return devices.some(device => {
    const expiresAt = new Date(device.expiresAt);
    return device.userAgent === currentUA && expiresAt > now;
  });
}

/**
 * Get the current device's trust record
 */
export function getCurrentDeviceTrust(): TrustedDevice | null {
  const devices = getTrustedDevices();
  const currentUA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const now = new Date();
  
  const device = devices.find(d => d.userAgent === currentUA);
  
  if (!device) return null;
  
  const expiresAt = new Date(device.expiresAt);
  if (expiresAt < now) {
    // Device trust has expired, remove it
    removeTrustedDevice(device.id);
    return null;
  }
  
  // Update last used timestamp
  device.lastUsedAt = now.toISOString();
  saveTrustedDevices(devices);
  
  return device;
}

/**
 * Trust the current device
 */
export function trustCurrentDevice(): TrustedDevice {
  const devices = getTrustedDevices();
  const info = getDeviceInfo();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRUSTED_DEVICE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  
  // Check if device already exists
  const existingIndex = devices.findIndex(d => d.userAgent === info.userAgent);
  
  const device: TrustedDevice = {
    id: existingIndex >= 0 ? devices[existingIndex].id : generateDeviceId(),
    name: info.name,
    userAgent: info.userAgent,
    platform: info.platform,
    addedAt: existingIndex >= 0 ? devices[existingIndex].addedAt : now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastUsedAt: now.toISOString(),
  };
  
  if (existingIndex >= 0) {
    devices[existingIndex] = device;
  } else {
    devices.push(device);
  }
  
  saveTrustedDevices(devices);
  
  return device;
}

/**
 * Save trusted devices list
 */
function saveTrustedDevices(devices: TrustedDevice[]): void {
  // Clean up expired devices first
  const now = new Date();
  const validDevices = devices.filter(d => new Date(d.expiresAt) > now);
  
  setJSONCookie(COOKIE_NAMES.TRUSTED_DEVICE, validDevices, {
    days: TRUSTED_DEVICE_EXPIRATION_DAYS,
    sameSite: 'strict',
  });
}

/**
 * Remove a trusted device by ID
 */
export function removeTrustedDevice(deviceId: string): void {
  const devices = getTrustedDevices();
  const filtered = devices.filter(d => d.id !== deviceId);
  saveTrustedDevices(filtered);
}

/**
 * Clear all trusted devices
 */
export function clearAllTrustedDevices(): void {
  deleteCookie(COOKIE_NAMES.TRUSTED_DEVICE);
}

/**
 * Update device name
 */
export function updateTrustedDeviceName(deviceId: string, name: string): void {
  const devices = getTrustedDevices();
  const device = devices.find(d => d.id === deviceId);
  
  if (device) {
    device.name = name;
    saveTrustedDevices(devices);
  }
}

// ============================================================================
// SECURITY HEADERS HELPERS
// ============================================================================

/**
 * Get security headers for API requests
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Add CSRF token
  const csrfToken = getOrCreateCSRFToken();
  headers['X-CSRF-Token'] = csrfToken;
  
  return headers;
}

/**
 * Verify request origin (for server-side use)
 */
export function verifyOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(origin);
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useCallback } from 'react';

/**
 * Hook for CSRF token management
 */
export function useCSRF() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return getOrCreateCSRFToken();
  });
  
  const refresh = useCallback(() => {
    const newToken = generateCSRFToken();
    setToken(newToken.token);
    return newToken.token;
  }, []);
  
  const validate = useCallback((tokenToValidate: string) => {
    return validateCSRFToken(tokenToValidate);
  }, []);
  
  return { token, refresh, validate };
}

/**
 * Hook for trusted device management
 */
export function useTrustedDevices() {
  const [devices, setDevices] = useState<TrustedDevice[]>(() => {
    if (typeof window === 'undefined') return [];
    return getTrustedDevices();
  });
  
  const [isTrusted, setIsTrusted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isCurrentDeviceTrusted();
  });
  
  const trustCurrent = useCallback(() => {
    const device = trustCurrentDevice();
    setDevices(getTrustedDevices());
    setIsTrusted(true);
    return device;
  }, []);
  
  const remove = useCallback((deviceId: string) => {
    removeTrustedDevice(deviceId);
    setDevices(getTrustedDevices());
    
    // Check if current device was removed
    if (!isCurrentDeviceTrusted()) {
      setIsTrusted(false);
    }
  }, []);
  
  const clearAll = useCallback(() => {
    clearAllTrustedDevices();
    setDevices([]);
    setIsTrusted(false);
  }, []);
  
  const currentDevice = getCurrentDeviceTrust();
  
  return {
    devices,
    isTrusted,
    currentDevice,
    trustCurrent,
    remove,
    clearAll,
  };
}