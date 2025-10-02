// Test file to verify zustand fix is working
import { createWithEqualityFn } from 'zustand/traditional';
import { useStoreWithEqualityFn } from 'zustand/traditional';

console.log('Zustand fix imported successfully');

// Create a simple test store
const useTestStore = createWithEqualityFn((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

console.log('Test store created successfully');

export { useTestStore };