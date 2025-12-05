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
        set((state) => {
          const id = Date.now().toString();

          const newWidget: Widget = {
            ...(w as any),
            id,

            title: (w as any).title || (w as any).name || "Untitled Widget",
            name: (w as any).name || (w as any).title || "Untitled Widget",

            refreshMs: (w as any).refreshMs ?? 60_000,
          };

          return {
            widgets: [...state.widgets, newWidget],
          };
        }),

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
         version: 1,  
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
