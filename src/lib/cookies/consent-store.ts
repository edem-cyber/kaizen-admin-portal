/**
 * Cookie Consent Store
 *
 * Zustand store for managing cookie consent state
 */

import { create } from "zustand";
import { getJSONCookie, setJSONCookie, deleteCookie } from "./utils";
import {
    ConsentStatus,
    ConsentRecord,
    DEFAULT_CONSENT_STATUS,
    COOKIE_NAMES,
    CONSENT_POLICY_VERSION,
    CONSENT_EXPIRATION_DAYS,
    CookieCategory,
} from "./types";

// ============================================================================
// STORE TYPES
// ============================================================================

interface ConsentState {
    /** Whether consent has been given */
    hasConsent: boolean;
    /** Current consent status for each category */
    status: ConsentStatus;
    /** Full consent record */
    record: ConsentRecord | null;
    /** Whether the consent banner should be shown */
    showBanner: boolean;
    /** Whether the settings dialog is open */
    settingsOpen: boolean;
    /** Whether the store has been hydrated from cookies */
    hydrated: boolean;

    // Actions
    /** Accept all cookies */
    acceptAll: () => void;
    /** Reject all non-essential cookies */
    rejectAll: () => void;
    /** Update consent for specific categories */
    updateConsent: (categories: Partial<ConsentStatus>) => void;
    /** Save consent with source tracking */
    saveConsent: (source: "banner" | "settings" | "api") => void;
    /** Open settings dialog */
    openSettings: () => void;
    /** Close settings dialog */
    closeSettings: () => void;
    /** Load consent from cookies */
    loadConsent: () => void;
    /** Reset consent (clear all) */
    resetConsent: () => void;
    /** Check if a category is allowed */
    isCategoryAllowed: (category: CookieCategory) => boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function createConsentRecord(
    status: ConsentStatus,
    source: "banner" | "settings" | "api",
): ConsentRecord {
    return {
        id: generateId(),
        status,
        timestamp: new Date().toISOString(),
        version: CONSENT_POLICY_VERSION,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        source,
    };
}

// ============================================================================
// STORE
// ============================================================================

export const useConsentStore = create<ConsentState>((set, get) => ({
    hasConsent: false,
    status: DEFAULT_CONSENT_STATUS,
    record: null,
    showBanner: false, // Start as false to prevent flash
    settingsOpen: false,
    hydrated: false, // Track hydration state

    loadConsent: () => {
        const savedConsent = getJSONCookie<ConsentRecord>(COOKIE_NAMES.CONSENT);

        if (savedConsent) {
            // Check if consent version matches current version
            if (savedConsent.version === CONSENT_POLICY_VERSION) {
                set({
                    hasConsent: true,
                    status: savedConsent.status,
                    record: savedConsent,
                    showBanner: false,
                    hydrated: true,
                });
            } else {
                // Version mismatch - show banner to get new consent
                set({ showBanner: true, hasConsent: false, hydrated: true });
            }
        } else {
            // No consent saved - show banner
            set({ showBanner: true, hasConsent: false, hydrated: true });
        }
    },

    acceptAll: () => {
        const allAccepted: ConsentStatus = {
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
        };

        set({ status: allAccepted });
        get().saveConsent("banner");
    },

    rejectAll: () => {
        // Essential cookies cannot be rejected
        const onlyEssential: ConsentStatus = {
            ...DEFAULT_CONSENT_STATUS,
        };

        set({ status: onlyEssential });
        get().saveConsent("banner");
    },

    updateConsent: (categories) => {
        const currentStatus = get().status;
        const newStatus: ConsentStatus = {
            ...currentStatus,
            ...categories,
            essential: true, // Always true
        };

        set({ status: newStatus });
    },

    saveConsent: (source) => {
        const status = get().status;
        const record = createConsentRecord(status, source);

        // Save to cookie
        setJSONCookie(COOKIE_NAMES.CONSENT, record, {
            days: CONSENT_EXPIRATION_DAYS,
        });

        set({
            hasConsent: true,
            record,
            showBanner: false,
            settingsOpen: false,
        });

        // Clean up cookies for rejected categories
        if (!status.functional) {
            deleteCookie(COOKIE_NAMES.THEME);
            deleteCookie(COOKIE_NAMES.SIDEBAR_STATE);
            deleteCookie(COOKIE_NAMES.LANGUAGE);
            deleteCookie(COOKIE_NAMES.TABLE_PREFS);
            deleteCookie(COOKIE_NAMES.LAST_PAGE);
        }

        if (!status.analytics) {
            deleteCookie(COOKIE_NAMES.ANALYTICS_SESSION);
            deleteCookie(COOKIE_NAMES.ANALYTICS_USER);
            deleteCookie(COOKIE_NAMES.PAGE_VIEWS);
            deleteCookie(COOKIE_NAMES.FEATURE_USAGE);
        }
    },

    openSettings: () => {
        set({ settingsOpen: true });
    },

    closeSettings: () => {
        set({ settingsOpen: false });
    },

    resetConsent: () => {
        deleteCookie(COOKIE_NAMES.CONSENT);
        set({
            hasConsent: false,
            status: DEFAULT_CONSENT_STATUS,
            record: null,
            showBanner: true,
        });
    },

    isCategoryAllowed: (category) => {
        const status = get().status;
        return status[category] === true;
    },
}));

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-load consent on store creation (client-side only)
if (typeof window !== "undefined") {
    useConsentStore.getState().loadConsent();
}
