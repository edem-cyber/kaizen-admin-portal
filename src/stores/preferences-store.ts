import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
    // Theme preferences
    theme: "light" | "dark" | "system";
    setTheme: (theme: "light" | "dark" | "system") => void;

    // Table preferences
    tablePreferences: {
        pageSize: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    };
    setTablePreferences: (
        prefs: Partial<PreferencesState["tablePreferences"]>,
    ) => void;

    // Notification preferences
    notifications: {
        email: boolean;
        inApp: boolean;
        kaizenAdminUpdates: boolean;
        approvalRequests: boolean;
    };
    setNotificationPreference: (
        key: keyof PreferencesState["notifications"],
        value: boolean,
    ) => void;

    // Date format
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    setDateFormat: (format: PreferencesState["dateFormat"]) => void;

    // Currency format
    currency: string;
    setCurrency: (currency: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            theme: "system",
            setTheme: (theme) => set({ theme }),

            tablePreferences: {
                pageSize: 10,
            },
            setTablePreferences: (prefs) =>
                set((state) => ({
                    tablePreferences: { ...state.tablePreferences, ...prefs },
                })),

            notifications: {
                email: true,
                inApp: true,
                kaizenAdminUpdates: true,
                approvalRequests: true,
            },
            setNotificationPreference: (key, value) =>
                set((state) => ({
                    notifications: { ...state.notifications, [key]: value },
                })),

            dateFormat: "MM/DD/YYYY",
            setDateFormat: (format) => set({ dateFormat: format }),

            currency: "GHS",
            setCurrency: (currency) => set({ currency }),
        }),
        {
            name: "preferences-storage",
        },
    ),
);
