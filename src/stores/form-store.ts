import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KaizenAdminCreate } from '@/lib/generated/kaizenAdmin/models';

interface FormState {
  // Draft kaizenAdmins (auto-save)
  draftKaizenAdmins: {
    [key: string]: Partial<KaizenAdminCreate> & { lastSaved?: string };
  };
  saveDraftKaizenAdmin: (id: string, data: Partial<KaizenAdminCreate>) => void;
  getDraftKaizenAdmin: (id: string) => Partial<KaizenAdminCreate> | null;
  clearDraftKaizenAdmin: (id: string) => void;
  clearAllDrafts: () => void;

  // Form auto-save timestamps
  lastSaved: {
    [formId: string]: string;
  };
  updateLastSaved: (formId: string) => void;
}

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      draftKaizenAdmins: {},
      saveDraftKaizenAdmin: (id, data) =>
        set((state) => ({
          draftKaizenAdmins: {
            ...state.draftKaizenAdmins,
            [id]: {
              ...data,
              lastSaved: new Date().toISOString(),
            },
          },
        })),
      getDraftKaizenAdmin: (id) => {
        const draft = get().draftKaizenAdmins[id];
        return draft ? { ...draft } : null;
      },
      clearDraftKaizenAdmin: (id) =>
        set((state) => {
          const newDrafts = { ...state.draftKaizenAdmins };
          delete newDrafts[id];
          return { draftKaizenAdmins: newDrafts };
        }),
      clearAllDrafts: () => set({ draftKaizenAdmins: {} }),

      lastSaved: {},
      updateLastSaved: (formId) =>
        set((state) => ({
          lastSaved: {
            ...state.lastSaved,
            [formId]: new Date().toISOString(),
          },
        })),
    }),
    {
      name: 'form-storage',
      partialize: (state) => ({
        draftKaizenAdmins: state.draftKaizenAdmins,
        lastSaved: state.lastSaved,
      }),
    }
  )
);

