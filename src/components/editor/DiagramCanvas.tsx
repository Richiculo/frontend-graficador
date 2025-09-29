"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { useEditor } from "@/store/editor";
import { moveClass, createRelation, deleteClass, deleteRelation } from "@/lib/diagram";

import Toolbar from "./canvas/Toolbar";
import GridOverlay from "./canvas/GridOverlay";
import EdgeContextMenu from "./canvas/EdgeContextMenu";
import EdgeLayer from "./canvas/EdgeLayer";
import ClassCard from "./canvas/ClassCard";

import { usePanZoom } from "./canvas/hooks/usePanZoom";
import { useShortcuts } from "./canvas/hooks/useShortcuts";
import { GRID_SIZE, CLASS_WIDTH, CLASS_HEIGHT } from "./canvas/constants";

type SizeMap = Record<number, { width: number; height: number }>;

export default function DiagramCanvas() {
  const { diagramId } = useParams<{ diagramId: string }>();
  const diagramIdNum = diagramId ? Number(diagramId) : undefined;

  const [sizeMap, setSizeMap] = useState<SizeMap>({});
  const [relationKind, setRelationKind] = useState<string>("ASSOCIATION");

  const {
    nodes,
    edges,
    moveNode,
    select,
    selectedId,
    relationMode,
    relationSource,
    setRelationSource,
    addEdge,
    removeEdgeLocal,
    attrMap,
    methodMap,
    setNodes,
    toggleRelationMode,
    setSelectedRelation,
  } = useEditor();

  const [snap, setSnap] = useState(true);
  const [drag, setDrag] = useState<{ id: number; ox: number; oy: number } | null>(null);
  const [edgeMenu, setEdgeMenu] = useState<{ id: number; x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);

  const {
    zoom,
    pan,
    setZoom,
    resetView,
    spaceDown,
    setSpaceDown,
    onWheel,
    onMouseDownCanvas,
    onMouseMoveCanvas,
    onMouseUpCanvas,
    transformStyle,
  } = usePanZoom();

  // Defaults por tipo (lo que se envía al crear)
  // Nota: herencia/implementación → multiplicidad vacía "" (no null) para no romper el backend.
  const DEFAULT_MULTS: Record<string, { src: string; tgt: string }> = {
    ASSOCIATION:     { src: "1", tgt: "0..*" },
    AGGREGATION:     { src: "1", tgt: "0..*" },
    COMPOSITION:     { src: "1..*", tgt: "1" },
    INHERITANCE:     { src: "",  tgt: ""     },
    IMPLEMENTATION:  { src: "",  tgt: ""     },
  };
  const FALLBACK = { src: "1", tgt: "0..*" };

  // medir altura (auto-grow)
  const onMeasureNode = useCallback((id: number, rect: { width: number; height: number }) => {
    setSizeMap((m) => {
      const prevW = m[id]?.width ?? CLASS_WIDTH;
      const prevH = m[id]?.height ?? CLASS_HEIGHT;
      const nextH = Math.round(rect.height);
      if (Math.abs(prevH - nextH) < 0.5) return m;
      return { ...m, [id]: { width: prevW, height: nextH } };
    });
  }, []);

  // redimensionado manual
  const onResizeNode = useCallback((id: number, rect: { width: number; height: number }) => {
    setSizeMap((m) => ({ ...m, [id]: { width: Math.round(rect.width), height: Math.round(rect.height) } }));
  }, []);

  // shortcuts
  useShortcuts({ selectedId, setRelationSource, setEdgeMenu, toggleRelationMode });

  // barra espaciadora para pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === " ") setSpaceDown(true); };
    const up = (e: KeyboardEvent) => { if (e.key === " ") setSpaceDown(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [setSpaceDown]);

  // eventos canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleToggleRelationMode = () => toggleRelationMode();

    const handleDeleteClass = async () => {
      if (!selectedId) return;
      if (!confirm("¿Eliminar clase seleccionada?")) return;
      try {
        await deleteClass(selectedId);
        setNodes(nodes.filter((n) => n.id !== selectedId));
        select(undefined);
      } catch {
        console.error("No se pudo eliminar la clase");
      }
    };

    const handleEditEdge = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      const id = detail.id as number | undefined;
      if (!id) return;
      const edge = edges.find((x) => x.id === id);
      if (!edge) return;
      const a = nodes.find((n) => n.id === edge.sourceClassId);
      const b = nodes.find((n) => n.id === edge.targetClassId);
      if (!a || !b) return;
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      setEdgeMenu({ id, x, y });
      setSelectedRelation(id);
    };

    canvas.addEventListener("toggle-relation-mode", handleToggleRelationMode);
    canvas.addEventListener("delete-class", handleDeleteClass);
    canvas.addEventListener("edit-edge", handleEditEdge as EventListener);

    return () => {
      canvas.removeEventListener("toggle-relation-mode", handleToggleRelationMode);
      canvas.removeEventListener("delete-class", handleDeleteClass);
      canvas.removeEventListener("edit-edge", handleEditEdge as EventListener);
    };
  }, [selectedId, nodes, setNodes, select, edges, toggleRelationMode, setSelectedRelation]);

  const applySnap = useCallback((v: number) => (snap ? Math.round(v / GRID_SIZE) * GRID_SIZE : v), [snap]);

  function onMouseDownNode(e: React.MouseEvent, id: number) {
    if (relationMode) {
      if (!relationSource) {
        setRelationSource(id);
        select(id);
        return;
      }
      if (relationSource === id) {
        setRelationSource(undefined);
        return;
      }
      (async () => {
        try {
          if (diagramIdNum == null || Number.isNaN(diagramIdNum)) {
            alert("No se pudo determinar el diagrama (diagramId). Abre el editor desde /editor/[diagramId].");
            return;
          }

          const kindKey = (relationKind ?? "ASSOCIATION") as string;
          const def = DEFAULT_MULTS[kindKey] ?? FALLBACK;

          const rel = await createRelation(diagramIdNum, {
            kind: (relationKind as any) ?? "ASSOCIATION",
            sourceClassId: relationSource!,
            targetClassId: id,
            // IMPORTANTE: nunca null -> backend los tiene NOT NULL
            sourceMult: def.src,
            targetMult: def.tgt,
            navigableAToB: true,
            navigableBToA: false,
            sourceRole: null,
            targetRole: null,
          });
          let srcMult = (rel as any).sourceMult ?? def.src ?? "";
          let tgtMult = (rel as any).targetMult ?? def.tgt ?? "";
          if ((rel.kind ?? relationKind) === "COMPOSITION") {
            tgtMult = "1";
            srcMult = "1..*";
          }

          addEdge({
            id: (rel as any).id,
            kind: rel.kind ?? relationKind,
            sourceClassId: relationSource!,
            targetClassId: id,
            sourceMult: (rel as any).sourceMult ?? def.src ?? "",
            targetMult: (rel as any).targetMult ?? def.tgt ?? "",
            sourceRole: rel.sourceRole ?? null,
            targetRole: rel.targetRole ?? null,
          });
        } catch {
          // noop
        } finally {
          setRelationSource(undefined);
        }
      })();
      return;
    }
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setDrag({ id, ox: e.clientX - rect.left, oy: e.clientY - rect.top });
    select(id);
  }

  function onMouseMove(e: React.MouseEvent) {
    onMouseMoveCanvas(e);
    if (!drag) return;
    const canvasRect = viewRef.current?.getBoundingClientRect();
    const x = (e.clientX - (canvasRect?.left ?? 0) - drag.ox - pan.x) / zoom;
    const y = (e.clientY - (canvasRect?.top ?? 0) - drag.oy - pan.y) / zoom;
    moveNode(drag.id, applySnap(Math.max(0, x)), applySnap(Math.max(0, y)));
  }

  async function onMouseUp() {
    onMouseUpCanvas();
    if (drag) {
      const n = nodes.find((n) => n.id === drag.id);
      if (n) {
        try {
          await moveClass(n.id, n.x, n.y);
        } catch {}
      }
    }
    setDrag(null);
  }

  async function handleDeleteEdge(edgeId: number) {
    if (!confirm("¿Eliminar relación?")) return;
    try {
      if (diagramIdNum == null || Number.isNaN(diagramIdNum)) {
        alert("No se pudo determinar el diagrama (diagramId).");
        return;
      }
      await deleteRelation(diagramIdNum, edgeId);
      removeEdgeLocal(edgeId);
      setEdgeMenu(null);
      setSelectedRelation(null);
    } catch (e) {
      console.error("No se pudo eliminar la relación", e);
    }
  }

  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)));

  const nodeCards = useMemo(
    () =>
      nodes.map((n) => ({
        n,
        width: sizeMap[n.id]?.width ?? CLASS_WIDTH,
        height: sizeMap[n.id]?.height ?? CLASS_HEIGHT,
        attrs: attrMap[n.id] ?? [],
        methods: methodMap[n.id] ?? [],
      })),
    [nodes, sizeMap, attrMap, methodMap]
  );

  return (
    <div ref={canvasRef} className="relative h-screen w-full bg-background overflow-hidden" data-canvas-root>
      <Toolbar
        relationMode={relationMode}
        relationSource={relationSource}
        toggleRelationMode={toggleRelationMode}
        setRelationSource={setRelationSource}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetView={resetView}
        snap={snap}
        setSnap={setSnap}
        zoomPercent={zoom * 100}
        relationKind={relationKind}
        setRelationKind={setRelationKind}
      />

      {relationMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 glass rounded-2xl px-6 py-4">
          <div className="flex items-center gap-3 text-primary">
            <svg className="size-5 animate-pulse" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none" />
              <path fill="currentColor" d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4z" />
            </svg>
            <div>
              <p className="font-medium text-foreground">Modo relación activo</p>
              <p className="text-sm text-muted-foreground">
                {relationSource ? "Selecciona la clase destino" : "Selecciona la clase origen"}
              </p>
            </div>
          </div>
        </div>
      )}

      <EdgeContextMenu
        edgeMenu={edgeMenu}
        zoom={zoom}
        pan={pan}
        onDelete={handleDeleteEdge}
        onClose={() => setEdgeMenu(null)}
        canvasRef={canvasRef}
      />

      <div
        ref={viewRef}
        className="absolute inset-0"
        onWheel={onWheel}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseDown={(e) => {
          onMouseDownCanvas(e);
          setEdgeMenu(null);
        }}
        style={{ cursor: spaceDown ? "grab" : "default" }}
      >
        <GridOverlay zoom={zoom} pan={pan} />

        <div className="absolute left-0 top-0" style={transformStyle}>
          <EdgeLayer
            nodes={nodeCards.map((c) => ({ id: c.n.id, x: c.n.x, y: c.n.y, width: c.width, height: c.height }))}
            edges={edges}
            canvasRef={canvasRef}
            onOpenMenu={setEdgeMenu}
            defaults={{ width: CLASS_WIDTH, height: CLASS_HEIGHT }}
          />

          {nodeCards.map((c) => (
            <ClassCard
              key={c.n.id}
              n={c.n}
              selectedId={selectedId}
              relationSource={relationSource}
              attrs={c.attrs}
              methods={c.methods}
              width={c.width}
              height={c.height}
              onMouseDown={onMouseDownNode}
              onSelect={select}
              onMeasure={onMeasureNode}
              onResize={onResizeNode}
              minW={160}
              minH={100}
            />
          ))}
        </div>
      </div>

      <div className="absolute right-6 bottom-6 z-20 glass rounded-2xl p-4 max-w-xs">
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <svg className="size-4" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="currentColor" d="M10 9h4v6h-4z" />
          </svg>
          Controles
        </h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted/50 rounded">Espacio</kbd>
            <span>+ arrastrar para mover vista</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted/50 rounded">Ctrl</kbd>
            <span>+ rueda para zoom</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted/50 rounded">R</kbd>
            <span>para modo relación</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted/50 rounded">Del</kbd>
            <span>para eliminar seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted/50 rounded">Click</kbd>
            <span>en relación para editar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
