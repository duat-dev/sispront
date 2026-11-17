import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PerfilUsuario =
  | 'RECEPCIONISTA'
  | 'ENFERMEIRO_TRIAGEM'
  | 'MEDICO_PLANTONISTA'
  | 'GESTOR_LEITOS'
  | 'EQUIPE_HIGIENIZACAO';

interface AuthState {
  token: string | null;
  nome: string | null;
  perfil: PerfilUsuario | null;
  lastActivity: number;
  setAuth: (token: string, nome: string, perfil: PerfilUsuario) => void;
  updateActivity: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      nome: null,
      perfil: null,
      lastActivity: Date.now(),
      setAuth: (token, nome, perfil) =>
        set({ token, nome, perfil, lastActivity: Date.now() }),
      updateActivity: () => set({ lastActivity: Date.now() }),
      logout: () => set({ token: null, nome: null, perfil: null }),
    }),
    { name: 'sispront-auth' }
  )
);