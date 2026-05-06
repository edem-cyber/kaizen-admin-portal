/**
 * Normalize an opaque list-response payload into a plain array.
 *
 * Kaizen Admin service list endpoints are typed as `{ [k: string]: unknown }`
 * in the generated models but at runtime return one of:
 *   - a bare array
 *   - `{ items: [...] }`
 *   - `{ <resource_name>: [...] }`  (e.g. `{ fiscal_years: [...] }`)
 *
 * Pass the candidate resource keys in preferred order. The first array-valued
 * match wins; otherwise returns an empty array.
 */
export function extractItems<T>(payload: unknown, ...candidateKeys: string[]): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (!payload || typeof payload !== "object") return [];
    const obj = payload as Record<string, unknown>;
    for (const key of ["items", ...candidateKeys]) {
        const value = obj[key];
        if (Array.isArray(value)) return value as T[];
    }
    return [];
}
