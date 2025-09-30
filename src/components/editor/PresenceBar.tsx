"use client";
import { useEffect, useMemo } from "react";
import { usePresence } from "@/store/presence";
import { UserCheck, Circle } from "lucide-react";

export default function PresenceBar({
  currentUser,
}: {
  currentUser: { id: number; username: string };
}) {
  const { users, prune } = usePresence();

  // Limpia “fantasmas” cada 10s
  useEffect(() => {
    const t = setInterval(() => prune(15000), 10000);
    return () => clearInterval(t);
  }, [prune]);

  const list = useMemo(
    () =>
      Object.values(users)
        .sort((a, b) => b.lastSeen - a.lastSeen)
        .slice(0, 8),
    [users]
  );

  return (
    <div className="mt-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
        <UserCheck className="size-4" /> Colaboradores
      </div>

      {list.length === 0 ? (
        <div className="text-xs text-muted-foreground">Solo tú por aquí.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((u) => {
            const color =
              u.state === "editing"
                ? "bg-emerald-500"
                : u.state === "viewing"
                ? "bg-blue-500"
                : "bg-gray-400";
            const you = u.id === currentUser.id ? " (tú)" : "";
            const label =
              u.state === "editing" ? "está editando" :
              u.state === "viewing" ? "viendo" : "inactivo";
            return (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 bg-sidebar-accent text-sidebar-accent-foreground"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                    {u.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{u.username}{you}</span>{" "}
                    <span className="text-muted-foreground">— {label}</span>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
