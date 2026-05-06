import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Kaizen AdminCreate } from '@/lib/generated/requisition/models';

interface FormState {
  // Draft requisitions (auto-save)
  draftKaizen Admins: {
    [key: string]: Partial<Kaizen AdminCreate> & { lastSaved?: string };
  };
  saveDraftKaizen Admin: (id: string, data: Partial<Kaizen AdminCreate>) => void;
  getDraftKaizen Admin: (id: string) => Partial<Kaizen AdminCreate> | null;
  clearDraftKaizen Admin: (id: string) => void;
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
      draftKaizen Admins: {},
      saveDraftKaizen Admin: (id, data) =>
        set((state) => ({
          draftKaizen Admins: {
            ...state.draftKaizen Admins,
            [id]: {
              ...data,
              lastSaved: new Date().toISOString(),
            },
          },
        })),
      getDraftKaizen Admin: (id) => {
        const draft = get().draftKaizen Admins[id];
        return draft ? { ...draft } : null;
      },
      clearDraftKaizen Admin: (id) =>
        set((state) => {
          const newDrafts = { ...state.draftKaizen Admins };
          delete newDrafts[id];
          return { draftKaizen Admins: newDrafts };
        }),
      clearAllDrafts: () => set({ draftKaizen Admins: {} }),

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
        draftKaizen Admins: state.draftKaizen Admins,
        lastSaved: state.lastSaved,
      }),
    }
  )
);

