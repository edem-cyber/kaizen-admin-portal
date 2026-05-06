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

  // Kaizen Admin filters (persisted across sessions)
  requisitionFilters: {
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    category?: string;
  };
  setKaizen AdminFilters: (filters: Partial<UIState['requisitionFilters']>) => void;
  clearKaizen AdminFilters: () => void;

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

      // Kaizen Admin filters
      requisitionFilters: {},
      setKaizen AdminFilters: (filters) =>
        set((state) => ({
          requisitionFilters: { ...state.requisitionFilters, ...filters },
        })),
      clearKaizen AdminFilters: () => set({ requisitionFilters: {} }),

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
        requisitionFilters: state.requisitionFilters,
        approvalFilters: state.approvalFilters,
        vendorFilters: state.vendorFilters,
      }),
    }
  )
);

