// This file is created to potentially resolve zustand warnings
// by ensuring the newer APIs are used if zustand is a transitive dependency

import { createWithEqualityFn } from 'zustand/traditional';
import { useStoreWithEqualityFn } from 'zustand/traditional';

// Export them to ensure they're available
export { createWithEqualityFn, useStoreWithEqualityFn };