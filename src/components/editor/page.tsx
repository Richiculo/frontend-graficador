'use client';

import { useAuthGuardEffect } from '@/hooks/useAuthGuard';
import AppSidebar from '@/components/sidebar/AppSidebar';
import DiagramCanvas from '@/components/editor/DiagramCanvas';
import { CheckCircle2, Code2, FileJson, AlertTriangle, UserPlus2 } from 'lucide-react';
import InviteDialog from '../colab/InviteDialog';

import { useEffect, useMemo, useState } from 'react';

type EditorPageProps = {
  params: { id?: string };
};

export default function EditorPage({ params }: EditorPageProps) {
  useAuthGuardEffect();

  const diagramIdStr = params?.id;                 // viene de la ruta /editor/[id]
  const diagramIdNum = useMemo(
    () => (diagramIdStr ? Number(diagramIdStr) : NaN),
    [diagramIdStr]
  );

  // --- INVITACIONES (link sharing) ---
  const [inviteOpen, setInviteOpen] = useState(false);
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    // Ajusta la clave según dónde guardes tu token
    const t = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    setJwt(t);
  }, []);

  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    []
  );

  return (
    <main className="flex min-h-dvh">
      <AppSidebar />

      <section className="flex-1">
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-4 sticky top-0 bg-neutral-950 z-10">
          <h1 className="font-medium">
            Editor — Proyecto #{diagramIdStr ?? '—'}
          </h1>

          <div className="space-x-2">
            <button className="rounded-xl bg-neutral-800 px-3 py-2 inline-flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Validar
            </button>
            <button className="rounded-xl bg-neutral-800 px-3 py-2 inline-flex items-center gap-2">
              <Code2 className="size-4" />
              Exportar código
            </button>
            <button className="rounded-xl bg-neutral-800 px-3 py-2 inline-flex items-center gap-2">
              <FileJson className="size-4" />
              Postman
            </button>

            {/* Nuevo: Invitar colaboradores */}
            <button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={() => setInviteOpen(true)}
              disabled={!diagramIdStr || !jwt}
              title={!jwt ? 'Inicia sesión para invitar' : 'Invitar colaboradores'}
            >
              <UserPlus2 className="size-4" />
              Invitar
            </button>
          </div>
        </header>

        {/* Guardita si falta el ID, útil en dev */}
        {!diagramIdStr ? (
          <div className="m-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 inline-flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-medium">
                No se detectó el parámetro <code>[id]</code> en la ruta.
              </div>
              <div className="text-sm opacity-80">
                Abrí esta página como <code>/editor/&lt;id&gt;</code> para poder crear/eliminar relaciones.
              </div>
            </div>
          </div>
        ) : null}

        {/* Pasamos el id al canvas */}
        <DiagramCanvas diagramId={diagramIdStr} />
      </section>

      <aside className="w-80 shrink-0 border-l border-neutral-800 p-4">
        <h2 className="text-sm uppercase tracking-widest opacity-70">Propiedades</h2>
        <div className="mt-3 text-sm opacity-80">
          Selecciona un elemento para editar…
        </div>
      </aside>

      {/* Modal de Invitaciones */}
      {inviteOpen && !Number.isNaN(diagramIdNum) && jwt && (
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          diagramId={diagramIdNum}
          apiUrl={apiUrl}
          jwt={jwt}
        />
      )}
    </main>
  );
}
