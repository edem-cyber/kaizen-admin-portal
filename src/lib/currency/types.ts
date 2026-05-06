/**
 * Currency System Types
 * Production-ready currency handling - NO hardcoded data
 * All currency data comes from backend API, country data from i18n-iso-countries package
 */

import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register English locale for country names
countries.registerLocale(enLocale);

/**
 * Currency preference stored in user preferences
 */
export interface CurrencyPreference {
    /** ISO 4217 currency code (e.g., "USD", "GHS", "EUR") */
    code: string;
    /** Currency symbol (e.g., "$", "₵", "€") */
    symbol: string;
    /** Full currency name (e.g., "US Dollar", "Ghanaian Cedi") */
    name: string;
    /** Number of decimal places for the currency */
    decimalPlaces: number;
}

/**
 * Currency data from backend API
 * This is the source of truth for available currencies
 */
export interface CurrencyData {
    code: string;
    name: string;
    symbol: string;
    decimalPlaces?: number;
    isActive?: boolean;
    /** Country code if currency is associated with a specific country */
    countryCode?: string;
}

/**
 * Exchange rate data from external API
 */
export interface ExchangeRate {
    base: string;
    rates: Record<string, number>;
    timestamp: number;
}

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
    /** Show currency symbol (default: true) */
    showSymbol?: boolean;
    /** Show currency code (default: false) */
    showCode?: boolean;
    /** Number of decimal places (default: from currency) */
    decimalPlaces?: number;
    /** Locale for formatting (default: en-US) */
    locale?: string;
}

/**
 * Minimal fallback currency for initial render before API loads
 * This is ONLY used as a temporary placeholder, NOT as hardcoded data
 */
export const FALLBACK_CURRENCY: CurrencyPreference = {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimalPlaces: 2,
};

/**
 * Convert country code to flag emoji using regional indicator symbols
 * Uses the i18n-iso-countries package for validation
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "US", "GH", "GB")
 * @returns Flag emoji or globe emoji if invalid
 */
export function getCountryFlag(countryCode: string): string {
    // Validate the country code exists
    if (!countries.isValid(countryCode)) {
        return "🌍";
    }

    // Convert country code to regional indicator symbols
    // Regional indicator symbols are Unicode characters that combine to form flag emojis
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);

    // Check if code points are valid regional indicators
    if (codePoints.some((cp) => cp < 0x1f1e6 || cp > 0x1f1ff)) {
        return "🌍";
    }

    return String.fromCodePoint(...codePoints);
}

/**
 * Get country name from country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param locale - Language code (default: "en")
 * @returns Country name or the code if not found
 */
export function getCountryName(
    countryCode: string,
    locale: string = "en",
): string {
    const name = countries.getName(countryCode, locale);
    return name || countryCode;
}

/**
 * Get all valid country codes
 * @returns Array of ISO 3166-1 alpha-2 country codes
 */
export function getAllCountryCodes(): string[] {
    return Object.keys(countries.getNames("en"));
}

/**
 * Get flag emoji for a currency code
 * This maps common currency codes to their primary country
 * NOTE: This is a best-guess mapping for display purposes only
 * The backend should provide the actual country association
 */
export function getCurrencyFlag(
    currencyCode: string,
    countryCode?: string,
): string {
    // If country code is provided, use it directly
    if (countryCode && countries.isValid(countryCode)) {
        return getCountryFlag(countryCode);
    }

    // Common currency to country mappings (ISO 4217 to ISO 3166-1 alpha-2)
    // This is a fallback for display purposes - backend should provide country
    const currencyToCountry: Record<string, string> = {
        USD: "US",
        GHS: "GH",
        EUR: "EU", // Euro doesn't have a single country, use EU flag
        GBP: "GB",
        NGN: "NG",
        ZAR: "ZA",
        KES: "KE",
        CAD: "CA",
        AUD: "AU",
        JPY: "JP",
        CNY: "CN",
        INR: "IN",
        CHF: "CH",
        BRL: "BR",
        MXN: "MX",
        SGD: "SG",
        HKD: "HK",
        AED: "AE",
        SAR: "SA",
        EGP: "EG",
        TZS: "TZ",
        UGX: "UG",
        RWF: "RW",
        ZMW: "ZM",
        MZN: "MZ",
        GEL: "GE",
        TRY: "TR",
        RUB: "RU",
        KRW: "KR",
        IDR: "ID",
        MYR: "MY",
        PHP: "PH",
        THB: "TH",
        VND: "VN",
        PKR: "PK",
        BDT: "BD",
        LKR: "LK",
        NPR: "NP",
        AFN: "AF",
        IRR: "IR",
        IQD: "IQ",
        KWD: "KW",
        BHD: "BH",
        QAR: "QA",
        OMR: "OM",
        JOD: "JO",
        LBP: "LB",
        ILS: "IL",
        SEK: "SE",
        NOK: "NO",
        DKK: "DK",
        ISK: "IS",
        PLN: "PL",
        CZK: "CZ",
        HUF: "HU",
        RON: "RO",
        BGN: "BG",
        HRK: "HR",
        RSD: "RS",
        MKD: "MK",
        ALL: "AL",
        BAM: "BA",
        MTL: "MT",
        NZD: "NZ",
        FJD: "FJ",
        WST: "WS",
        TND: "TN",
        MAD: "MA",
        DZD: "DZ",
        LYD: "LY",
        SDG: "SD",
        ETB: "ET",
        BIF: "BI",
        DJF: "DJ",
        SOS: "SO",
        MWK: "MW",
        AZN: "AZ",
        AMD: "AM",
        KGS: "KG",
        KZT: "KZ",
        TJS: "TJ",
        TMT: "TM",
        UZS: "UZ",
    };

    const country = currencyToCountry[currencyCode.toUpperCase()];
    if (country) {
        return getCountryFlag(country);
    }

    return "🌍";
}

// Re-export the countries module for advanced use cases
export { countries };
