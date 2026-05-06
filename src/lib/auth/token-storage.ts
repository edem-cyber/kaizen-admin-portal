/**
 * Token storage utilities using localStorage
 */

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

export const tokenStorage = {
    getToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token: string): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(TOKEN_KEY, token);
    },

    removeToken(): void {
        if (typeof window === "undefined") return;
        localStorage.removeItem(TOKEN_KEY);
    },

    getRefreshToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setRefreshToken(token: string): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    },

    removeRefreshToken(): void {
        if (typeof window === "undefined") return;
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    getUser(): any | null {
        if (typeof window === "undefined") return null;
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    setUser(user: any): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    removeUser(): void {
        if (typeof window === "undefined") return;
        localStorage.removeItem(USER_KEY);
    },

    clear(): void {
        this.removeToken();
        this.removeRefreshToken();
        this.removeUser();
    },
};
