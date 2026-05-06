import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Modal states
  modals: {
    [key: string]: boolean;
  };
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;

  // KaizenAdmin filters (persisted across sessions)
  kaizenAdminFilters: {
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    category?: string;
  };
  setKaizenAdminFilters: (filters: Partial<UIState['kaizenAdminFilters']>) => void;
  clearKaizenAdminFilters: () => void;

  // Approval filters
  approvalFilters: {
    status?: string;
    search?: string;
  };
  setApprovalFilters: (filters: Partial<UIState['approvalFilters']>) => void;
  clearApprovalFilters: () => void;

  // Vendor filters
  vendorFilters: {
    search?: string;
    category?: string;
  };
  setVendorFilters: (filters: Partial<UIState['vendorFilters']>) => void;
  clearVendorFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Modals
      modals: {},
      openModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        })),
      closeModal: (modalId) =>
        set((state) => {
          const newModals = { ...state.modals };
          delete newModals[modalId];
          return { modals: newModals };
        }),
      isModalOpen: (modalId) => get().modals[modalId] || false,

      // KaizenAdmin filters
      kaizenAdminFilters: {},
      setKaizenAdminFilters: (filters) =>
        set((state) => ({
          kaizenAdminFilters: { ...state.kaizenAdminFilters, ...filters },
        })),
      clearKaizenAdminFilters: () => set({ kaizenAdminFilters: {} }),

      // Approval filters
      approvalFilters: {},
      setApprovalFilters: (filters) =>
        set((state) => ({
          approvalFilters: { ...state.approvalFilters, ...filters },
        })),
      clearApprovalFilters: () => set({ approvalFilters: {} }),

      // Vendor filters
      vendorFilters: {},
      setVendorFilters: (filters) =>
        set((state) => ({
          vendorFilters: { ...state.vendorFilters, ...filters },
        })),
      clearVendorFilters: () => set({ vendorFilters: {} }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        kaizenAdminFilters: state.kaizenAdminFilters,
        approvalFilters: state.approvalFilters,
        vendorFilters: state.vendorFilters,
      }),
    }
  )
);

