/**
 * Token Refresh Logic for Production-Ready Auth
 * Handles automatic token refresh when access token expires
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./token-storage";
import { API_CONFIG } from "../api-client";
import type { AuthTokenPair } from "../generated/user/models/authTokenPair";

// State
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
}> = [];

// Process queued requests after refresh completes
const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

/**
 * Attempt to refresh the access token using the refresh token
 * Returns the new access token or throws an error
 */
export async function refreshAccessToken(): Promise<string> {
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
        throw new Error("No refresh token available");
    }

    // Use axios directly to avoid interceptor loop. Per the user-service
    // contract, the refresh token rides in the Authorization header
    // (NOT in the body), and the endpoint lives at /auth/v1/token/refresh
    // — no `/api/v1` prefix.
    const response = await axios.post<AuthTokenPair>(
        `${API_CONFIG.userBaseUrl}/auth/v1/token/refresh`,
        undefined,
        {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        }
    );

    const { access_token: accessToken, refresh_token: newRefreshToken } =
        response.data ?? {};

    // Defensive validation: localStorage.setItem coerces `undefined` to the
    // string "undefined", which would corrupt subsequent reads. Treat any
    // missing/non-string field as a refresh failure so the caller falls
    // through to logout instead of writing garbage and silently breaking
    // auth on the next request.
    if (typeof accessToken !== "string" || !accessToken) {
        throw new Error("Refresh response missing access_token");
    }
    if (typeof newRefreshToken !== "string" || !newRefreshToken) {
        throw new Error("Refresh response missing refresh_token");
    }

    tokenStorage.setToken(accessToken);
    tokenStorage.setRefreshToken(newRefreshToken);

    return accessToken;
}

/**
 * Handle 401 error with automatic token refresh
 * Returns true if token was refreshed and request should be retried
 * Returns false if user should be logged out
 */
export async function handleTokenExpiry(
    originalRequest: InternalAxiosRequestConfig & { _retry?: boolean },
    onLogout: () => void
): Promise<boolean> {
    const refreshToken = tokenStorage.getRefreshToken();
    
    // No refresh token - user needs to login again
    if (!refreshToken) {
        onLogout();
        return false;
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({
                resolve: (token: string) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(true);
                },
                reject: (error: Error) => {
                    reject(error);
                },
            });
        });
    }

    isRefreshing = true;

    try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        isRefreshing = false;
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return true;
    } catch (error) {
        processQueue(error as Error, null);
        isRefreshing = false;
        
        // Clear tokens and trigger logout
        tokenStorage.clear();
        onLogout();
        
        return false;
    }
}

/**
 * Check if error is a 401 that should trigger token refresh
 */
export function shouldRefreshToken(error: AxiosError): boolean {
    return (
        error?.response?.status === 401 &&
        !(error?.config as InternalAxiosRequestConfig & { _retry?: boolean })?._retry &&
        tokenStorage.getRefreshToken() !== null
    );
}

/**
 * Get the current refresh state (useful for debugging)
 */
export function getRefreshState() {
    return {
        isRefreshing,
        queueLength: failedQueue.length,
        hasRefreshToken: !!tokenStorage.getRefreshToken(),
    };
}