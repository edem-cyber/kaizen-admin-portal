"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStorage } from "@/lib/auth/token-storage";
import { API_CONFIG } from "@/lib/api-client";
import {
    getListNotificationsApiV1NotificationsGetQueryKey,
    getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey,
} from "@/lib/generated/requisition/notifications-v1/notifications-v1";

/**
 * Subscribe to the notifications SSE stream and invalidate notification
 * queries on each incoming event.
 *
 * EventSource cannot send Authorization headers natively, so the bearer
 * token is attached as a query parameter and `withCredentials` is set
 * — the backend can authenticate via whichever it supports. On
 * connection failure the browser retries automatically and the
 * notifications list still updates on manual refresh, so degraded
 * mode is acceptable.
 */
export function useNotificationStream(enabled = true) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled) return;
        if (typeof window === "undefined" || typeof EventSource === "undefined") return;

        const token = tokenStorage.getToken();
        if (!token) return;

        const url = `${API_CONFIG.requisitionBaseUrl}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;

        let source: EventSource | null = null;
        try {
            source = new EventSource(url, { withCredentials: true });
        } catch {
            return;
        }

        const invalidate = () => {
            queryClient.invalidateQueries({
                queryKey: getListNotificationsApiV1NotificationsGetQueryKey(),
            });
            queryClient.invalidateQueries({
                queryKey: getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey(),
            });
        };

        source.onmessage = invalidate;
        // Browser auto-reconnects on errors; keep this silent rather than
        // surfacing a toast on every transient hiccup.
        source.onerror = () => { /* intentionally silent */ };

        return () => {
            source?.close();
        };
    }, [enabled, queryClient]);
}
