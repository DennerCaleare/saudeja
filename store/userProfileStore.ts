import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PerfilUsuario, PerfilInfantil } from '../types';

interface UserProfileState {
  perfil: PerfilUsuario | null;
  filhos: PerfilInfantil[];
  onboardingConcluido: boolean;
  hidratado: boolean;  // true após AsyncStorage ser lido
  setPerfil: (perfil: PerfilUsuario) => void;
  addFilho: (filho: PerfilInfantil) => void;
  updateFilho: (id: string, dados: Partial<PerfilInfantil>) => void;
  setOnboardingConcluido: (value: boolean) => void;
  carregarPerfil: () => Promise<void>;
  salvarPerfil: () => Promise<void>;
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  perfil: null,
  filhos: [],
  onboardingConcluido: false,
  hidratado: false,

  setPerfil: (perfil) => {
    set({ perfil });
    get().salvarPerfil();
  },

  addFilho: (filho) => {
    set((state) => ({ filhos: [...state.filhos, filho] }));
    get().salvarPerfil();
  },

  updateFilho: (id, dados) => {
    set((state) => ({
      filhos: state.filhos.map((f) => (f.id === id ? { ...f, ...dados } : f)),
    }));
    get().salvarPerfil();
  },

  setOnboardingConcluido: (value) => {
    set({ onboardingConcluido: value });
    AsyncStorage.setItem('onboarding_concluido', JSON.stringify(value));
  },

  carregarPerfil: async () => {
    try {
      const [perfilRaw, filhosRaw, onboardingRaw] = await Promise.all([
        AsyncStorage.getItem('perfil_usuario'),
        AsyncStorage.getItem('filhos'),
        AsyncStorage.getItem('onboarding_concluido'),
      ]);
      set({
        perfil: perfilRaw ? JSON.parse(perfilRaw) : null,
        filhos: filhosRaw ? JSON.parse(filhosRaw) : [],
        onboardingConcluido: onboardingRaw ? JSON.parse(onboardingRaw) : false,
        hidratado: true,
      });
    } catch {
      set({ hidratado: true }); // Mesmo em erro, marca como hidratado
    }
  },

  salvarPerfil: async () => {
    const { perfil, filhos } = get();
    try {
      await Promise.all([
        perfil ? AsyncStorage.setItem('perfil_usuario', JSON.stringify(perfil)) : Promise.resolve(),
        AsyncStorage.setItem('filhos', JSON.stringify(filhos)),
      ]);
    } catch {
      // Silencia
    }
  },
}));
