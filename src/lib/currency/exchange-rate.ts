/**
 * Exchange Rate Service
 * Fetches live exchange rates from a trusted public API
 *
 * Uses ExchangeRate-API (https://www.exchangerate-api.com/)
 * Free tier: 1,500 requests/month, no API key required for free tier
 */

import type { ExchangeRate } from "./types";

// Cache for exchange rates (24 hour TTL)
const EXCHANGE_RATE_CACHE_KEY = "exchange-rates-cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedExchangeRate {
    data: ExchangeRate;
    timestamp: number;
}

/**
 * Free exchange rate API endpoints (fallback options)
 * These are free, no-API-key required services
 */
interface ExchangeRateApiResponse {
    base_code?: string;
    base?: string;
    rates: Record<string, number>;
    time_last_update_utc?: string;
}

interface FrankfurterApiResponse {
    base: string;
    rates: Record<string, number>;
}

interface JsdCurrencyApiResponse {
    [currency: string]: Record<string, number>;
}

const EXCHANGE_RATE_APIS = [
    {
        name: "open.er-api.com",
        getUrl: (base: string) => `https://open.er-api.com/v6/latest/${base}`,
        parse: (data: ExchangeRateApiResponse): ExchangeRate => ({
            base: data.base_code || "USD",
            rates: data.rates,
            timestamp: data.time_last_update_utc
                ? new Date(data.time_last_update_utc).getTime()
                : Date.now(),
        }),
    },
    {
        name: "api.frankfurter.app",
        getUrl: (base: string) =>
            `https://api.frankfurter.app/latest?from=${base}`,
        parse: (data: FrankfurterApiResponse): ExchangeRate => ({
            base: data.base,
            rates: data.rates,
            timestamp: Date.now(),
        }),
    },
    {
        name: "cdn.jsdelivr.net",
        getUrl: (base: string) =>
            `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`,
        parse: (data: JsdCurrencyApiResponse, base: string): ExchangeRate => {
            const rates: Record<string, number> = {};
            const baseRates = data[base.toLowerCase()];
            if (baseRates) {
                // Convert currency codes to uppercase
                for (const [code, rate] of Object.entries(baseRates)) {
                    rates[code.toUpperCase()] = rate;
                }
            }
            return {
                base: base.toUpperCase(),
                rates,
                timestamp: Date.now(),
            };
        },
    },
];

/**
 * Get cached exchange rates
 */
function getCachedRates(): CachedExchangeRate | null {
    try {
        const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
        if (!cached) return null;

        const parsed: CachedExchangeRate = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - parsed.timestamp < CACHE_TTL) {
            return parsed;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Cache exchange rates
 */
function cacheRates(data: ExchangeRate): void {
    try {
        const cached: CachedExchangeRate = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(cached));
    } catch {
        // Ignore cache errors
    }
}

/**
 * Fetch exchange rates from API with fallback
 */
export async function fetchExchangeRates(
    baseCurrency: string = "USD",
): Promise<ExchangeRate> {
    // Check cache first
    const cached = getCachedRates();
    if (cached && cached.data.base === baseCurrency) {
        return cached.data;
    }

    // Try each API in order
    for (const api of EXCHANGE_RATE_APIS) {
        try {
            const response = await fetch(api.getUrl(baseCurrency), {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                continue;
            }

            const data = await response.json();
            const exchangeRate = api.parse(data, baseCurrency);

            // Validate the response
            if (
                exchangeRate.rates &&
                Object.keys(exchangeRate.rates).length > 0
            ) {
                cacheRates(exchangeRate);
                return exchangeRate;
            }
        } catch (error) {
            console.warn(`Exchange rate API ${api.name} failed:`, error);
            continue;
        }
    }

    // If all APIs fail, try to return cached data even if expired
    if (cached) {
        console.warn("Using expired exchange rate cache due to API failures");
        return cached.data;
    }

    // If no cache and all APIs fail, return a fallback with rate 1
    console.error("All exchange rate APIs failed, using fallback rate of 1");
    return {
        base: baseCurrency,
        rates: { [baseCurrency]: 1 },
        timestamp: Date.now(),
    };
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
): Promise<number> {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const rates = await fetchExchangeRates(fromCurrency);

    const rate = rates.rates[toCurrency];
    if (!rate) {
        console.warn(
            `No exchange rate found for ${toCurrency}, using 1:1 rate`,
        );
        return amount;
    }

    return amount * rate;
}

/**
 * Convert currency synchronously using cached rates
 * Returns null if no cached rates available
 */
export function convertCurrencySync(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
): number | null {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const cached = getCachedRates();
    if (!cached) {
        return null;
    }

    // If base matches from currency
    if (cached.data.base === fromCurrency) {
        const rate = cached.data.rates[toCurrency];
        return rate ? amount * rate : null;
    }

    // If we need to convert via USD
    if (cached.data.base === "USD") {
        const fromRate = cached.data.rates[fromCurrency];
        const toRate = cached.data.rates[toCurrency];

        if (fromRate && toRate) {
            // Convert to USD first, then to target
            const usdAmount = amount / fromRate;
            return usdAmount * toRate;
        }
    }

    return null;
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
): Promise<number> {
    if (fromCurrency === toCurrency) {
        return 1;
    }

    const rates = await fetchExchangeRates(fromCurrency);
    const rate = rates.rates[toCurrency];

    if (!rate) {
        console.warn(`No exchange rate found for ${toCurrency}`);
        return 1;
    }

    return rate;
}

/**
 * Clear the exchange rate cache
 */
export function clearExchangeRateCache(): void {
    try {
        localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
    } catch {
        // Ignore errors
    }
}

/**
 * Check if exchange rates are available (cached or can be fetched)
 */
export async function areExchangeRatesAvailable(): Promise<boolean> {
    const cached = getCachedRates();
    if (cached) return true;

    try {
        const rates = await fetchExchangeRates("USD");
        return Object.keys(rates.rates).length > 0;
    } catch {
        return false;
    }
}
