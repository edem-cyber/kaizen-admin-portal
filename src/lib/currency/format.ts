/**
 * Currency Formatting Utilities
 * Production-ready formatting functions for currency display
 */

import type { CurrencyPreference, CurrencyFormatOptions } from "./types";

/**
 * Format a number as currency
 * 
 * @param amount - The amount to format (number or string)
 * @param currency - Currency preference containing code, symbol, decimal places
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56, { code: "USD", symbol: "$", name: "US Dollar", decimalPlaces: 2 })
 * // Returns: "$1,234.56"
 * 
 * formatCurrency(1234.56, { code: "EUR", symbol: "€", name: "Euro", decimalPlaces: 2 }, { showCode: true })
 * // Returns: "€1,234.56 EUR"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: CurrencyPreference,
  options: CurrencyFormatOptions = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    decimalPlaces,
    locale = "en-US",
  } = options;

  // Handle null/undefined
  if (amount === null || amount === undefined) {
    return "-";
  }

  // Convert string to number
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  // Handle NaN
  if (isNaN(numAmount)) {
    return "-";
  }

  // Use Intl.NumberFormat for consistent formatting
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces ?? currency.decimalPlaces,
    maximumFractionDigits: decimalPlaces ?? currency.decimalPlaces,
  });

  const formattedNumber = formatter.format(numAmount);

  // Build the output string
  const parts: string[] = [];

  if (showSymbol) {
    parts.push(currency.symbol);
  }

  parts.push(formattedNumber);

  if (showCode) {
    parts.push(currency.code);
  }

  return parts.join("");
}

/**
 * Format currency with Intl.NumberFormat (uses browser's built-in currency support)
 * This is useful when you want locale-aware currency formatting
 * 
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code
 * @param locale - Locale string (default: en-US)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrencyIntl(1234.56, "USD") // Returns: "$1,234.56"
 * formatCurrencyIntl(1234.56, "EUR", "de-DE") // Returns: "1.234,56 €"
 */
export function formatCurrencyIntl(
  amount: number | string | null | undefined,
  currencyCode: string,
  locale: string = "en-US"
): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "-";
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(numAmount);
  } catch {
    // Fallback if currency code is not supported
    return `${currencyCode} ${numAmount.toLocaleString(locale)}`;
  }
}

/**
 * Parse a currency string to a number
 * 
 * @param value - Currency string to parse
 * @returns Numeric value or NaN if parsing fails
 * 
 * @example
 * parseCurrency("$1,234.56") // Returns: 1234.56
 * parseCurrency("€1.234,56") // Returns: 1234.56 (European format)
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and whitespace
  const cleaned = value.replace(/[^\d.,\-]/g, "");

  // Handle European format (1.234,56) vs US format (1,234.56)
  const hasCommaDecimal = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".");

  if (hasCommaDecimal) {
    // European format: remove thousand separators (.) and convert decimal (,) to (.)
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  } else {
    // US format: remove thousand separators (,)
    return parseFloat(cleaned.replace(/,/g, ""));
  }
}

/**
 * Get currency symbol for a currency code
 * Uses Intl.NumberFormat to get the symbol
 * 
 * @param currencyCode - ISO 4217 currency code
 * @param locale - Locale string (default: en-US)
 * @returns Currency symbol
 */
export function getCurrencySymbol(
  currencyCode: string,
  locale: string = "en-US"
): string {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const parts = formatter.formatToParts(0);
    const currencyPart = parts.find((part) => part.type === "currency");
    return currencyPart?.value || currencyCode;
  } catch {
    return currencyCode;
  }
}

/**
 * Format a number as a compact currency (e.g., $1.2K, $1.5M)
 * Useful for dashboards and summaries
 * 
 * @param amount - The amount to format
 * @param currency - Currency preference
 * @param locale - Locale string
 * @returns Compact formatted currency string
 * 
 * @example
 * formatCurrencyCompact(1234567, { code: "USD", symbol: "$", ... })
 * // Returns: "$1.2M"
 */
export function formatCurrencyCompact(
  amount: number | string | null | undefined,
  currency: CurrencyPreference,
  locale: string = "en-US"
): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "-";
  }

  const formatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return `${currency.symbol}${formatter.format(numAmount)}`;
}

/**
 * Calculate percentage of a total in currency
 * 
 * @param amount - The amount
 * @param total - The total
 * @returns Percentage (0-100)
 */
export function calculatePercentage(
  amount: number | string,
  total: number | string
): number {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const numTotal = typeof total === "string" ? parseFloat(total) : total;

  if (isNaN(numAmount) || isNaN(numTotal) || numTotal === 0) {
    return 0;
  }

  return (numAmount / numTotal) * 100;
}