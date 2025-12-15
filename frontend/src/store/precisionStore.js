// src/precisionStore.js
import { create } from 'zustand';

const usePrecisionStore = create((set, get) => ({
  // default precision
  precision: 4,

  // setter function
  setPrecision: (value, commit = false) => {
    // undefined / null
    if (value === undefined || value === null) {
      if (commit) set({ precision: 1 });
      return;
    }

    const str = String(value).trim();

    // empty string
    if (str === '') {
      if (commit) set({ precision: 1 });
      return;
    }

    const num = Number(str);
    if (Number.isNaN(num)) return; // ignore invalid text

    // while typing → allow only positive values, don't force 1
    if (!commit) {
      if (num > 0) set({ precision: Math.floor(num) });
      return;
    }

    // commit-time validation
    if (num <= 0) {
      set({ precision: 1 });
      return;
    }

    set({ precision: Math.floor(num) });
  },
    

  // getter (optional)
  getPrecision: () => {
    return get().precision;
  },
}));

export default usePrecisionStore;
