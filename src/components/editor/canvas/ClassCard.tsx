// src/components/editor/canvas/ClassCard.tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  n: any;
  selectedId?: number;
  relationSource?: number;
  attrs: any[];
  methods: any[];
  width: number;
  height: number;
  minW?: number;
  minH?: number;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onSelect: (id: number) => void;
  onMeasure: (id: number, rect: { width: number; height: number }) => void;
  onResize: (id: number, rect: { width: number; height: number }) => void;
};

export default function ClassCard(p: Props) {
  const selected = p.selectedId === p.n.id;
  const pulsing = p.relationSource === p.n.id;

  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: p.width, height: p.height });
  const [resizing, setResizing] = useState<null | { ox: number; oy: number; w0: number; h0: number }>(null);

  // Mantener tamaño controlado externamente si cambia
  useEffect(() => { setSize({ width: p.width, height: p.height }); }, [p.width, p.height]);

  // Medir automáticamente según contenido (auto-grow)
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        p.onMeasure(p.n.id, { width: Math.round(cr.width), height: Math.round(cr.height) });
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [p.n.id, p.onMeasure]);

  const onMouseDownHandle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setResizing({ ox: e.clientX, oy: e.clientY, w0: rect.width, h0: rect.height });
  }, []);

  const onMouseMoveDoc = useCallback((e: MouseEvent) => {
    if (!resizing) return;
    const dw = e.clientX - resizing.ox;
    const dh = e.clientY - resizing.oy;
    const w = Math.max(p.minW ?? 140, resizing.w0 + dw);
    const h = Math.max(p.minH ?? 100, resizing.h0 + dh);
    setSize({ width: w, height: h });
  }, [resizing, p.minW, p.minH]);

  const onMouseUpDoc = useCallback(() => {
    if (!resizing) return;
    setResizing(null);
    // Persistimos en estado del canvas
    p.onResize(p.n.id, { width: Math.round(size.width), height: Math.round(size.height) });
  }, [resizing, size, p]);

  useEffect(() => {
    if (!resizing) return;
    document.addEventListener("mousemove", onMouseMoveDoc);
    document.addEventListener("mouseup", onMouseUpDoc);
    return () => {
      document.removeEventListener("mousemove", onMouseMoveDoc);
      document.removeEventListener("mouseup", onMouseUpDoc);
    };
  }, [resizing, onMouseMoveDoc, onMouseUpDoc]);

  return (
    <div
      id={`class-${p.n.id}`}
      ref={ref}
      onMouseDown={(e) => p.onMouseDown(e, p.n.id)}
      onClick={() => p.onSelect(p.n.id)}
      className={`absolute rounded-2xl border shadow-lg transition-all cursor-grab active:cursor-grabbing
        ${selected ? "border-primary bg-card shadow-primary/20 scale-105" : "border-border bg-card hover:border-primary/50 hover:shadow-xl"}
        ${pulsing ? "animate-pulse-glow" : ""}`}
      style={{
        left: p.n.x,
        top: p.n.y,
        width: size.width,          // ← controlado
        // height: auto por contenido; sólo fijamos minHeight
        minHeight: p.minH ?? 100,
      }}
      onDoubleClick={() => p.onSelect(p.n.id)}
    >
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate" title={p.n.name}>{p.n.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{p.n.id}</span>
        </div>
      </div>

      {/* Contenido completo */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
            Atributos: {p.attrs.length}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
            Métodos: {p.methods.length}
          </span>
        </div>

        {p.attrs.length > 0 && (
          <div className="space-y-1 text-xs">
            {p.attrs.map((a: any) => (
              <div key={a.id} className="text-muted-foreground">+ {a.name}: {a.type}</div>
            ))}
          </div>
        )}

        {p.methods.length > 0 && (
          <div className="space-y-1 text-xs">
            {p.methods.map((m: any) => (
              <div key={m.id} className="text-muted-foreground">+ {m.name}(): {m.returnType}</div>
            ))}
          </div>
        )}
      </div>

      {/* Handle de redimensionado (esquina inferior derecha) */}
      <div
        onMouseDown={onMouseDownHandle}
        className="absolute right-1.5 bottom-1.5 size-3 rounded-sm bg-primary/60 hover:bg-primary cursor-se-resize"
        title="Redimensionar"
      />
    </div>
  );
}
