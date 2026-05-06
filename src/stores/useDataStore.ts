import { create } from "zustand";
import type { EdaPayload, InsightPayload, ProfilePayload } from "@/lib/types";

export interface DataState {
  csvText: string;
  filename: string;
  target: string | null;
  profile: ProfilePayload | null;
  eda: EdaPayload | null;
  insight: InsightPayload | null;
  setCsv: (text: string, filename: string) => void;
  setTarget: (t: string | null) => void;
  clearAnalysis: () => void;
  setProfile: (p: ProfilePayload | null) => void;
  setEda: (e: EdaPayload | null) => void;
  setInsight: (i: InsightPayload | null) => void;
}

export const useDataStore = create<DataState>((set) => ({
  csvText: "",
  filename: "",
  target: null,
  profile: null,
  eda: null,
  insight: null,
  setCsv: (text, filename) =>
    set({
      csvText: text,
      filename,
      profile: null,
      eda: null,
      insight: null,
      target: null,
    }),
  setTarget: (target) => set({ target }),
  clearAnalysis: () => set({ profile: null, eda: null, insight: null }),
  setProfile: (profile) => set({ profile }),
  setEda: (eda) => set({ eda }),
  setInsight: (insight) => set({ insight }),
}));
