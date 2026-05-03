import { create } from 'zustand';
import storage from '../utils/storage';

export const useAuthStore = create((set) => ({
  token: null,
  role: null,
  user: null,
  onboardingCompleted: false,
  setOnboardingCompleted: (val) => set({ onboardingCompleted: val }),
  setAuth: (token, role, user) => set({ token, role, user }),
  updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
  logout: async () => {
    await storage.deleteItemAsync('token');
    set({ token: null, role: null, user: null });
  },
}));
