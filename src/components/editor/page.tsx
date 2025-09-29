'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import AppSidebar from '@/components/sidebar/AppSidebar';
import DiagramCanvas from '@/components/editor/DiagramCanvas';
import { CheckCircle2, Code2, FileJson, AlertTriangle } from 'lucide-react';

type EditorPageProps = {
  params: { id?: string };
};

export default function EditorPage({ params }: EditorPageProps) {
  useAuthGuard();

  const diagramId = params?.id; // viene de la ruta /editor/[id]

  return (
    <main className="flex min-h-dvh">
      <AppSidebar />

      <section className="flex-1">
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-4 sticky top-0 bg-neutral-950 z-10">
          <h1 className="font-medium">
            Editor — Proyecto #{diagramId ?? '—'}
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
          </div>
        </header>

        {/* Guardita si falta el ID, útil en dev */}
        {!diagramId ? (
          <div className="m-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 inline-flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-medium">No se detectó el parámetro <code>[id]</code> en la ruta.</div>
              <div className="text-sm opacity-80">
                Abrí esta página como <code>/editor/&lt;id&gt;</code> para poder crear/eliminar relaciones.
              </div>
            </div>
          </div>
        ) : null}

        {/* Pasamos el id al canvas */}
        <DiagramCanvas diagramId={diagramId} />
      </section>

      <aside className="w-80 shrink-0 border-l border-neutral-800 p-4">
        <h2 className="text-sm uppercase tracking-widest opacity-70">Propiedades</h2>
        <div className="mt-3 text-sm opacity-80">
          Selecciona un elemento para editar…
        </div>
      </aside>
    </main>
  );
}
