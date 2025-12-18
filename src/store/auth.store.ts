import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (_user: User | null) => void;
  setLoading: (_loading: boolean) => void;
  reset: () => void;
}

/**
 * Zustand store for authentication state
 *
 * This store manages the current user and loading state.
 * It's used across the app to access auth information.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  setLoading: (loading) => set({ loading }),

  reset: () => set({ user: null, loading: false }),
}));
