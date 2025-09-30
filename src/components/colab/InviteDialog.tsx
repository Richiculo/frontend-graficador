"use client";
import { useEffect, useMemo, useState } from "react";
import { createInvite, listInvites, revokeInvite } from "../../lib/colab/api";

type InviteItem = {
  id: number;
  inviteeEmail: string;
  role: "EDITOR" | "VIEWER";
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  token?: string; // puede no venir para invitaciones aceptadas o si el backend no lo expone
};

export default function InviteDialog({
  open,
  onOpenChange,
  diagramId,
  apiUrl,
  jwt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  diagramId: number;
  apiUrl: string;
  jwt: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<InviteItem[]>([]);
  const [lastLink, setLastLink] = useState<string>("");

  const baseAppUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const inviteUrl = useMemo(
    () => (token: string) =>
      `${baseAppUrl}/invitations/accept?token=${encodeURIComponent(token)}`,
    [baseAppUrl]
  );

  async function refresh() {
    try {
      const data = await listInvites({ apiUrl, jwt, diagramId });
      setList(data as InviteItem[]);
    } catch (e: any) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onCreate() {
    try {
      setLoading(true);
      // El backend espera { email, role, expiresInDays }
      const inv = await createInvite({
        apiUrl,
        jwt,
        diagramId,
        email,
        role,
        expiresInDays: days,
      });
      // inv.token viene de la respuesta del POST
      const url = inviteUrl(inv.token);
      setLastLink(url);
      await navigator.clipboard?.writeText(url);
      await refresh();
      setEmail("");
    } catch (e: any) {
      alert(e.message || "Error creando invitación");
    } finally {
      setLoading(false);
    }
  }

  async function onRevoke(id: number) {
    try {
      await revokeInvite({ apiUrl, jwt, inviteId: id });
      await refresh();
    } catch (e: any) {
      alert(e.message || "Error revocando invitación");
    }
  }

  async function onCopyToken(token?: string) {
    if (!token) return;
    const url = inviteUrl(token);
    await navigator.clipboard?.writeText(url);
    setLastLink(url);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-5 w-[640px] shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Invitar colaboradores</h2>
          <button
            className="px-2 py-1 rounded hover:bg-gray-100"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <input
            className="col-span-2 border rounded-lg px-3 py-2"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Lector</option>
          </select>

          <div className="col-span-1">
            <label className="text-sm text-gray-500">Vence en (días)</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              value={days}
              min={1}
              max={30}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>

          <div className="col-span-2 flex items-end">
            <button
              disabled={loading || !email}
              onClick={onCreate}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear invitación y copiar link"}
            </button>
          </div>
        </div>

        {lastLink && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 text-sm">
            Link copiado:{" "}
            <span className="font-mono break-all">{lastLink}</span>
          </div>
        )}

        <div className="mb-2 font-medium">Invitaciones</div>
        <div className="max-h-64 overflow-auto border rounded-lg">
          {list.length === 0 && (
            <div className="p-3 text-sm text-gray-500">
              No hay invitaciones aún.
            </div>
          )}

          {list.map((inv) => {
            const hasToken = Boolean(inv.token) && inv.status === "PENDING";
            return (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 border-b last:border-b-0"
              >
                <div className="text-sm">
                  <div className="font-medium">{inv.inviteeEmail}</div>
                  <div className="text-gray-500">
                    Rol: {inv.role} · Estado: {inv.status} · Vence:{" "}
                    {new Date(inv.expiresAt).toLocaleString()}
                  </div>
                  {!hasToken && inv.status === "PENDING" && (
                    <div className="text-xs text-amber-600 mt-1">
                      Esta invitación no expone token. Revócala y crea una nueva
                      para obtener un link copi-able.
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded border"
                    disabled={!hasToken}
                    title={
                      hasToken
                        ? "Copiar link"
                        : "Sin token (revoca y crea nuevo)"
                    }
                    onClick={() => onCopyToken(inv.token)}
                  >
                    Copiar link
                  </button>

                  {inv.status === "PENDING" && (
                    <button
                      className="px-3 py-1 rounded bg-red-50 text-red-600 border border-red-200"
                      onClick={() => onRevoke(inv.id)}
                    >
                      Revocar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-right">
          <button
            className="px-4 py-2 rounded-lg border"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
