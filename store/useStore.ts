import { create } from "zustand";

export interface AppState {
  originalImage: string | null;
  currentImage: string | null;
  jsonSchema: any | null;
  history: { image: string; json: any }[];
  historyIndex: number;
  isProcessing: boolean;
  setOriginalImage: (image: string) => void;
  setCurrentImage: (image: string) => void;
  setJsonSchema: (schema: any) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  pushToHistory: (image: string, json: any) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  originalImage: null,
  currentImage: null,
  jsonSchema: null,
  history: [],
  historyIndex: -1,
  isProcessing: false,
  setOriginalImage: (image) =>
    set({ originalImage: image, currentImage: image }),
  setCurrentImage: (image) => set({ currentImage: image }),
  setJsonSchema: (schema) => set({ jsonSchema: schema }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  pushToHistory: (image, json) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ image, json });
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      set({
        historyIndex: newIndex,
        currentImage: state.image,
        jsonSchema: state.json,
      });
    }
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      set({
        historyIndex: newIndex,
        currentImage: state.image,
        jsonSchema: state.json,
      });
    }
  },
  reset: () =>
    set({
      originalImage: null,
      currentImage: null,
      jsonSchema: null,
      history: [],
      historyIndex: -1,
      isProcessing: false,
    }),
}));
