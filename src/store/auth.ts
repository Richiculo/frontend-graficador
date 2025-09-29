import { create } from 'zustand'
import { persist } from 'zustand/middleware'


type UserDTO = { id: number; email: string }

type AuthState = {
  token?: string
  user?: { id: string; email: string }
  setAuth: (token: string, user?: AuthState['user']) => void
  clear: () => void

    _hasHydrated: boolean
  _setHasHydrated: (v: boolean) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: undefined,
      user: undefined,
      setAuth: (token, user) => set({ token, user }),
      clear: () => set({ token: undefined, user: undefined }),

      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "auth",
      version: 1,
      onRehydrateStorage: () => (state) => {
        // llamado cuando termina la rehidratación desde storage
        state?._setHasHydrated(true)
      },
    }
  )
)

export const useAuthReady = () => useAuth((s) => s._hasHydrated)