import { create } from "zustand";

export type PresenceState = "viewing" | "editing" | "idle";

export type PresenceUser = {
  id: number;
  username: string;
  state: PresenceState;
  lastSeen: number; // Date.now()
};

type PresenceStore = {
  users: Record<number, PresenceUser>; // por userId
  upsert: (u: PresenceUser) => void;
  mark: (userId: number, state: PresenceState) => void;
  prune: (olderThanMs?: number) => void;
};

export const usePresence = create<PresenceStore>((set) => ({
  users: {},
  upsert: (u) =>
    set((s) => ({ users: { ...s.users, [u.id]: u } })),
  mark: (userId, state) =>
    set((s) => {
      const prev = s.users[userId];
      if (!prev) return s;
      return {
        users: {
          ...s.users,
          [userId]: { ...prev, state, lastSeen: Date.now() },
        },
      };
    }),
  prune: (olderThanMs = 15000) =>
    set((s) => {
      const now = Date.now();
      const next: Record<number, PresenceUser> = {};
      Object.values(s.users).forEach((u) => {
        if (now - u.lastSeen <= olderThanMs) next[u.id] = u;
      });
      return { users: next };
    }),
}));
