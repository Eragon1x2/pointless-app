import { create } from 'zustand';
import type { HistoryRecord, TargetPoint } from '../types';

interface ResultModalData {
  status: 'Win' | 'Lost' | 'Tech Lost';
  distanceSet: number;
  timeTakenMs?: number;
  route?: [number, number][];
  address?: string;
}

interface GameState {
  // Active game
  target: TargetPoint | null;
  route: [number, number][];

  // History
  history: HistoryRecord[];

  // UI
  isHistoryOpen: boolean;
  resultModalData: ResultModalData | null;

  // Actions
  setTarget: (target: TargetPoint | null) => void;
  setRoute: (updater: [number, number][] | ((prev: [number, number][]) => [number, number][])) => void;
  appendHistory: (
    status: 'Win' | 'Lost' | 'Tech Lost',
    dist: number,
    address?: string,
    timeTakenMs?: number,
    savedRoute?: [number, number][]
  ) => void;
  loadHistory: () => void;
  setIsHistoryOpen: (open: boolean) => void;
  setResultModalData: (data: ResultModalData | null) => void;

  /** Win round: save history + show modal + clear game state */
  winRound: () => void;

  /** Give Up: save history as Lost/Tech Lost + show modal + clear game state */
  giveUp: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  target: null,
  route: [],
  history: [],
  isHistoryOpen: false,
  resultModalData: null,

  setTarget: (target) => set({ target }),

  setRoute: (updater) => set((state) => ({
    route: typeof updater === 'function' ? updater(state.route) : updater,
  })),

  appendHistory: (status, dist, address, timeTakenMs, savedRoute) => {
    const newRecord: HistoryRecord = {
      distanceSet: dist,
      date: new Date().toISOString(),
      status,
      address,
      timeTakenMs,
      route: savedRoute,
    };
    set((state) => {
      const newHistory = [...state.history, newRecord];
      localStorage.setItem('history', JSON.stringify(newHistory));
      return { history: newHistory };
    });
  },

  loadHistory: () => {
    const saved = localStorage.getItem('history');
    if (saved) {
      try {
        set({ history: JSON.parse(saved) });
      } catch {
        // Corrupt data — ignore
      }
    }
  },

  setIsHistoryOpen: (open) => set({ isHistoryOpen: open }),

  setResultModalData: (data) => set({ resultModalData: data }),

  winRound: () => {
    const { target, route, appendHistory } = get();
    if (!target) return;
    const timeTakenMs = target.createdAt ? Date.now() - target.createdAt : undefined;
    appendHistory('Win', target.distanceSet, target.address, timeTakenMs, route);
    set({
      resultModalData: {
        status: 'Win',
        distanceSet: target.distanceSet,
        timeTakenMs,
        route,
        address: target.address,
      },
      target: null,
      route: [],
    });
  },

  giveUp: () => {
    const { target, route, appendHistory } = get();
    if (!target) return;
    const timeTakenMs = target.createdAt ? Date.now() - target.createdAt : undefined;
    const status: 'Lost' | 'Tech Lost' = target.unreachable ? 'Tech Lost' : 'Lost';
    appendHistory(status, target.distanceSet, target.address, timeTakenMs, route);
    set({
      resultModalData: {
        status,
        distanceSet: target.distanceSet,
        timeTakenMs,
        route,
        address: target.address,
      },
      target: null,
      route: [],
    });
  },
}));
