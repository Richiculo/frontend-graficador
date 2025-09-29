"use client";

import { ZoomIn, ZoomOut, Maximize, Link2, MousePointer2, GridIcon } from "lucide-react";

type Props = {
  relationMode: boolean;
  relationSource?: number | null;
  toggleRelationMode: () => void;
  setRelationSource: (id?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  snap: boolean;
  setSnap: (v: boolean | ((s: boolean) => boolean)) => void;
  zoomPercent: number;
  // nuevo:
  relationKind?: string;
  setRelationKind?: (k: string) => void;
};

export default function Toolbar(p: Props) {
  return (
    <>
      <div className="absolute left-6 top-6 z-20 flex items-center gap-1 glass rounded-2xl p-2">
        <button
          id="btn-select"
          title="Seleccionar (V)"
          className={`p-3 rounded-xl transition-all duration-200 hover:bg-white/10 ${!p.relationMode ? "bg-primary text-primary-foreground" : "text-foreground"}`}
          onClick={() => p.relationMode && p.toggleRelationMode()}
        >
          <MousePointer2 className="size-4" />
        </button>

        <button
          id="btn-relate"
          title="Relacionar (R)"
          className={`p-3 rounded-xl transition-all duration-200 hover:bg-white/10 ${p.relationMode ? "bg-primary text-primary-foreground animate-pulse-glow" : "text-foreground"}`}
          onClick={() => {
            if (p.relationSource) p.setRelationSource(undefined as any);
            p.toggleRelationMode();
          }}
        >
          <Link2 className="size-4" />
        </button>

        {p.relationMode && (
          <select
            className="ml-2 rounded-lg bg-neutral-800 px-2 py-1 text-xs"
            value={p.relationKind ?? "ASSOCIATION"}
            onChange={(e) => p.setRelationKind?.(e.target.value)}
            title="Tipo de relación a crear"
          >
            <option value="ASSOCIATION">Asociación</option>
            <option value="AGGREGATION">Agregación</option>
            <option value="COMPOSITION">Composición</option>
            <option value="INHERITANCE">Herencia</option>
            <option value="IMPLEMENTATION">Implementación</option>
          </select>
        )}

        <div className="mx-1 w-px h-6 bg-white/20" />

        <button title="Zoom out" className="p-3 rounded-xl text-foreground hover:bg-white/10" onClick={p.zoomOut}>
          <ZoomOut className="size-4" />
        </button>
        <button title="Zoom in" className="p-3 rounded-xl text-foreground hover:bg-white/10" onClick={p.zoomIn}>
          <ZoomIn className="size-4" />
        </button>
        <button title="Ajustar vista" className="p-3 rounded-xl text-foreground hover:bg-white/10" onClick={p.resetView}>
          <Maximize className="size-4" />
        </button>

        <div className="mx-1 w-px h-6 bg-white/20" />

        <button
          title="Snap a grilla (Ctrl+G)"
          className={`p-3 rounded-xl transition-all duration-200 hover:bg-white/10 ${p.snap ? "bg-primary text-primary-foreground" : "text-foreground"}`}
          onClick={() => p.setSnap((s) => !s)}
        >
          <GridIcon className="size-4" />
        </button>
      </div>

      <div className="absolute right-6 top-6 z-20 glass rounded-xl px-4 py-2">
        <span className="text-sm font-medium text-foreground">{Math.round(p.zoomPercent)}%</span>
      </div>
    </>
  );
}
