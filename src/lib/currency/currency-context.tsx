/**
 * Currency Context and Provider
 * Provides currency state and operations throughout the application
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { CurrencyPreference, CurrencyData } from "./types";
import { FALLBACK_CURRENCY, getCurrencyFlag } from "./types";
import { formatCurrency, formatCurrencyIntl, formatCurrencyCompact } from "./format";
import {
  fetchExchangeRates,
  convertCurrency,
  convertCurrencySync,
  getExchangeRate,
} from "./exchange-rate";
import { useGetCurrencies } from "@/lib/generated/billing/currencies/currencies";

/**
 * Currency context value
 */
interface CurrencyContextValue {
  /** Current currency preference */
  currency: CurrencyPreference;

  /** All available currencies from backend */
  availableCurrencies: CurrencyData[];

  /** Whether currencies are being loaded */
  isLoadingCurrencies: boolean;

  /** Whether exchange rates are being loaded */
  isLoadingRates: boolean;

  /** Set the current currency */
  setCurrency: (currency: CurrencyPreference) => void;

  /** Set currency from a currency code (looks up symbol/name) */
  setCurrencyByCode: (code: string) => void;

  /** Format an amount in the current currency */
  format: (amount: number | string | null | undefined) => string;

  /** Format an amount using Intl.NumberFormat */
  formatIntl: (amount: number | string | null | undefined) => string;

  /** Format an amount in compact form (e.g., $1.2M) */
  formatCompact: (amount: number | string | null | undefined) => string;

  /** Convert an amount from one currency to another */
  convert: (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ) => Promise<number>;

  /** Convert an amount to the current currency */
  convertToCurrent: (
    amount: number,
    fromCurrency: string
  ) => Promise<number>;

  /** Get exchange rate between two currencies */
  getRate: (fromCurrency: string, toCurrency: string) => Promise<number>;

  /** Convert using cached rates (synchronous, may be null) */
  convertSync: (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ) => number | null;

  /** Get flag emoji for a currency code */
  getFlag: (code: string) => string;

  /** Currency symbol for current currency */
  symbol: string;

  /** Currency code for current currency */
  code: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// Storage key for currency preference
const CURRENCY_STORAGE_KEY = "user-currency-preference";

/**
 * Get currency preference from localStorage
 */
function getStoredCurrency(): CurrencyPreference | null {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CurrencyPreference;
  } catch {
    return null;
  }
}

/**
 * Store currency preference in localStorage
 */
function storeCurrency(currency: CurrencyPreference): void {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currency));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Find currency data by code from available currencies
 */
function findCurrencyByCode(
  code: string,
  currencies: CurrencyData[]
): CurrencyData | undefined {
  return currencies.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

/**
 * Currency Provider Props
 */
interface CurrencyProviderProps {
  children: React.ReactNode;
  /** Default currency to use if none stored (overrides stored preference) */
  defaultCurrency?: CurrencyPreference;
  /** Currency to derive from organization's country */
  organizationCurrencyCode?: string;
}

/**
 * Currency Provider Component
 */
export function CurrencyProvider({
  children,
  defaultCurrency,
  organizationCurrencyCode,
}: CurrencyProviderProps) {
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Fetch available currencies from billing backend
  const { data: currenciesResponse, isLoading: isLoadingCurrencies } =
    useGetCurrencies();

  // Parse available currencies from billing API
  // API returns { data: Currency[], pagination: {...} }
  const availableCurrencies = useMemo<CurrencyData[]>(() => {
    if (currenciesResponse?.data && currenciesResponse.data.length > 0) {
      return currenciesResponse.data.map((c) => ({
        id: (c as any).id,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        decimalPlaces: 2, // Billing API doesn't return decimal places
        isActive: c.active,
      }));
    }
    // Return empty array - no hardcoded fallback currencies
    return [];
  }, [currenciesResponse]);

  // Initialize currency preference
  const [currency, setCurrencyState] = useState<CurrencyPreference>(() => {
    // 1. Check localStorage for stored preference
    const stored = getStoredCurrency();
    if (stored) return stored;

    // 2. Use default currency prop if provided
    if (defaultCurrency) return defaultCurrency;

    // 3. Fallback to FALLBACK_CURRENCY (temporary placeholder until API loads)
    return FALLBACK_CURRENCY;
  });

  // Update currency when organization currency code changes
  useEffect(() => {
    if (organizationCurrencyCode) {
      const stored = getStoredCurrency();
      // Only auto-set if user hasn't explicitly set a preference
      if (!stored) {
        const orgCurrency = findCurrencyByCode(
          organizationCurrencyCode,
          availableCurrencies
        );
        if (orgCurrency) {
          setCurrencyState({
            code: orgCurrency.code,
            symbol: orgCurrency.symbol,
            name: orgCurrency.name,
            decimalPlaces: orgCurrency.decimalPlaces ?? 2,
          });
        }
      }
    }
  }, [organizationCurrencyCode, availableCurrencies]);

  // Prefetch exchange rates on mount
  useEffect(() => {
    const prefetchRates = async () => {
      setIsLoadingRates(true);
      try {
        await fetchExchangeRates(currency.code);
      } catch {
        // Ignore prefetch errors
      } finally {
        setIsLoadingRates(false);
      }
    };

    prefetchRates();
  }, [currency.code]);

  /**
   * Set currency preference
   */
  const setCurrency = useCallback((newCurrency: CurrencyPreference) => {
    setCurrencyState(newCurrency);
    storeCurrency(newCurrency);
  }, []);

  /**
   * Set currency by code
   */
  const setCurrencyByCode = useCallback(
    (code: string) => {
      const currencyData = findCurrencyByCode(code, availableCurrencies);
      if (currencyData) {
        setCurrency({
          code: currencyData.code,
          symbol: currencyData.symbol,
          name: currencyData.name,
          decimalPlaces: currencyData.decimalPlaces ?? 2,
        });
      } else {
        // If not found in available currencies, create a basic preference
        // using Intl to get symbol
        setCurrency({
          code: code.toUpperCase(),
          symbol: code.toUpperCase(),
          name: code.toUpperCase(),
          decimalPlaces: 2,
        });
      }
    },
    [availableCurrencies, setCurrency]
  );

  /**
   * Format amount in current currency
   */
  const format = useCallback(
    (amount: number | string | null | undefined) => {
      return formatCurrency(amount, currency);
    },
    [currency]
  );

  /**
   * Format using Intl
   */
  const formatIntl = useCallback(
    (amount: number | string | null | undefined) => {
      return formatCurrencyIntl(amount, currency.code);
    },
    [currency.code]
  );

  /**
   * Format compact
   */
  const formatCompact = useCallback(
    (amount: number | string | null | undefined) => {
      return formatCurrencyCompact(amount, currency);
    },
    [currency]
  );

  /**
   * Convert currency
   */
  const convert = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      return convertCurrency(amount, fromCurrency, toCurrency);
    },
    []
  );

  /**
   * Convert to current currency
   */
  const convertToCurrent = useCallback(
    async (amount: number, fromCurrency: string) => {
      return convertCurrency(amount, fromCurrency, currency.code);
    },
    [currency.code]
  );

  /**
   * Get exchange rate
   */
  const getRate = useCallback(
    async (fromCurrency: string, toCurrency: string) => {
      return getExchangeRate(fromCurrency, toCurrency);
    },
    []
  );

  /**
   * Sync convert
   */
  const convertSync = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string) => {
      return convertCurrencySync(amount, fromCurrency, toCurrency);
    },
    []
  );

  /**
   * Get flag emoji
   */
  const getFlag = useCallback((code: string) => {
    return getCurrencyFlag(code);
  }, []);

  // Context value
  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      availableCurrencies,
      isLoadingCurrencies,
      isLoadingRates,
      setCurrency,
      setCurrencyByCode,
      format,
      formatIntl,
      formatCompact,
      convert,
      convertToCurrent,
      getRate,
      convertSync,
      getFlag,
      symbol: currency.symbol,
      code: currency.code,
    }),
    [
      currency,
      availableCurrencies,
      isLoadingCurrencies,
      isLoadingRates,
      setCurrency,
      setCurrencyByCode,
      format,
      formatIntl,
      formatCompact,
      convert,
      convertToCurrent,
      getRate,
      convertSync,
      getFlag,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to access currency context
 * @throws Error if used outside CurrencyProvider
 */
export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

/**
 * Optional hook that returns null if outside provider
 * Useful for components that may or may not be wrapped
 */
export function useCurrencyOptional(): CurrencyContextValue | null {
  return useContext(CurrencyContext);
}

export { CurrencyContext };