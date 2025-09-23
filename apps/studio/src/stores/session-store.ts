import { create } from 'zustand'
import type { SessionInfo, UserProfile } from '@monte/shared'

interface SessionState {
  user: UserProfile | null
  session: SessionInfo | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  hydrate: (payload: { user: UserProfile; session: SessionInfo }) => void
  clear: () => void
  setStatus: (status: SessionState['status']) => void
  setUser: (user: UserProfile) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  session: null,
  status: 'idle',
  hydrate: (payload) =>
    set({ user: payload.user, session: payload.session, status: 'authenticated' }),
  clear: () => set({ user: null, session: null, status: 'unauthenticated' }),
  setStatus: (status) => set((state) => ({ ...state, status })),
  setUser: (user) => set((state) => ({ ...state, user })),
}))

export const getSessionState = () => useSessionStore.getState()
