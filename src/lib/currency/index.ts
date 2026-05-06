/**
 * Currency Module
 * Production-ready currency handling for the application
 * 
 * NO HARDCODED DATA - All currency data comes from backend API
 * Country data from i18n-iso-countries package
 */

// Types
export type {
  CurrencyPreference,
  CurrencyData,
  ExchangeRate,
  CurrencyFormatOptions,
} from "./types";

// Constants and utilities
export {
  FALLBACK_CURRENCY,
  getCurrencyFlag,
  getCountryFlag,
  getCountryName,
  getAllCountryCodes,
  countries,
} from "./types";

// Formatting utilities
export {
  formatCurrency,
  formatCurrencyIntl,
  formatCurrencyCompact,
  parseCurrency,
  getCurrencySymbol,
  calculatePercentage,
} from "./format";

// Exchange rate service
export {
  fetchExchangeRates,
  convertCurrency,
  convertCurrencySync,
  getExchangeRate,
  clearExchangeRateCache,
  areExchangeRatesAvailable,
} from "./exchange-rate";

// Context and hook
export {
  CurrencyProvider,
  useCurrency,
  useCurrencyOptional,
  CurrencyContext,
} from "./currency-context";