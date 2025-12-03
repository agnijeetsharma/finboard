"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Widget, DashboardExport } from "./types";

type State = {
  widgets: Widget[];
  addWidget: (w: Omit<Widget, "id">) => void;
  removeWidget: (id: string) => void;
  reorder: (from: number, to: number) => void;
  exportConfig: () => DashboardExport;
  importConfig: (data: DashboardExport) => void;
  hasSeenTour: boolean;
  setHasSeenTour: (v: boolean) => void;
  getWidget: (id: string) => Widget | undefined;
};

export const useDashboardStore = create<State>()(
  persist(
    (set, get) => ({
    
      hasSeenTour: false,
      setHasSeenTour: (v) => set({ hasSeenTour: v }),

      widgets: [],

      addWidget: (w) =>
        set((state) => ({
          widgets: [
            ...state.widgets,
            {
              id: Date.now().toString(), 
             
              title: w.title || w.name || "Untitled Widget",
              name: w.name || w.title || "Untitled Widget",
              type: w.type,
              provider: w.provider,
              endpoint: w.endpoint,
              params: w.params ?? {},
              mapping: w.mapping ?? {},
              refreshMs: w.refreshMs ?? 60_000,
            },
          ],
        })),

      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
        })),

      reorder: (from, to) => {
        const widgets = [...get().widgets];

        if (
          from === to ||
          from < 0 ||
          to < 0 ||
          from >= widgets.length ||
          to >= widgets.length
        ) {
          return;
        }

        const [moved] = widgets.splice(from, 1);
        widgets.splice(to, 0, moved);

        set({ widgets });
      },

      exportConfig: () => ({
        widgets: get().widgets,
      }),

      importConfig: (data) => {
        set({
          widgets: Array.isArray(data?.widgets)
            ? (data.widgets as Widget[])
            : [],
        });
      },

      getWidget: (id: string) => get().widgets.find((w) => w.id === id),
    }),
    {
      name: "finboard-dashboard",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAppStore = useDashboardStore;
export default useDashboardStore;
