"use client";

import { getConnectionPoints, getMultiplicityPositions } from "./utils/geometry";
import { getRelationStyle } from "./utils/styles";

type UmlEdgeLike = {
  id: number;
  kind: string;
  sourceClassId: number | null;
  targetClassId: number | null;
  sourceMult?: string | null;
  targetMult?: string | null;
  sourceRole?: string | null; // lo usamos como "etiqueta"
  targetRole?: string | null;
  associationClassId?: number | null; // ⬅️ NUEVO: clase intermedia
};

type NodeForEdges = {
  id: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  name?: string; // ⬅️ opcional para chip
};

type Props = {
  nodes: NodeForEdges[];
  edges: UmlEdgeLike[];
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onOpenMenu: (data: { id: number; x: number; y: number }) => void;
  defaults: { width: number; height: number };
};

export default function EdgeLayer({ nodes, edges, canvasRef, onOpenMenu, defaults }: Props) {
  // índice por id para uso rápido
  const nodesById = new Map<number, NodeForEdges>();
  for (const n of nodes) nodesById.set(n.id, n);

  return (
    <svg className="absolute inset-0 w-[4000px] h-[3000px] pointer-events-none">
      <defs>
        <marker id="arrow" markerWidth="12" markerHeight="12" refX="12" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L12,4 L0,8 z" fill="currentColor" className="text-primary" />
        </marker>

        <marker id="inheritance-arrow" markerWidth="16" markerHeight="12" refX="16" refY="6" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L16,6 L0,12 z" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
        </marker>

        <marker id="composition-diamond" markerWidth="16" markerHeight="12" refX="16" refY="6" orient="auto" markerUnits="strokeWidth">
          <path d="M0,6 L8,0 L16,6 L8,12 z" fill="currentColor" className="text-primary" />
        </marker>

        <marker id="aggregation-diamond" markerWidth="16" markerHeight="12" refX="16" refY="6" orient="auto" markerUnits="strokeWidth">
          <path d="M0,6 L8,0 L16,6 L8,12 z" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
        </marker>

        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {edges.map((edge) => {
        if (edge.sourceClassId == null || edge.targetClassId == null) return null;

        const a = nodesById.get(edge.sourceClassId);
        const b = nodesById.get(edge.targetClassId);
        if (!a || !b) return null;

        const { sourceX, sourceY, targetX, targetY } = getConnectionPoints(a, b, defaults);
        const { sourceMultX, sourceMultY, targetMultX, targetMultY } = getMultiplicityPositions(sourceX, sourceY, targetX, targetY);
        const relationStyle = getRelationStyle(edge.kind);

        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;

        const label = edge.sourceRole?.trim() || edge.targetRole?.trim() || edge.kind.toLowerCase();

        // Datos clase intermedia (si existe)
        const assocNode = edge.associationClassId ? nodesById.get(edge.associationClassId) : undefined;
        const assocCx = assocNode ? assocNode.x + (assocNode.width ?? defaults.width) / 2 : undefined;
        const assocCy = assocNode ? assocNode.y + (assocNode.height ?? defaults.height) / 2 : undefined;
        const assocName = assocNode?.name || "association";

        return (
          <g key={edge.id} className="pointer-events-auto">
            {/* Línea principal */}
            <line
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray={relationStyle.strokeDasharray}
              markerEnd={relationStyle.markerEnd}
              className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
              filter="url(#glow)"
              onClick={(event) => {
                event.stopPropagation();
                const ev = new CustomEvent("edit-edge", { detail: { id: edge.id }, bubbles: true });
                canvasRef.current?.dispatchEvent(ev);
                onOpenMenu({ id: edge.id, x: midX, y: midY });
              }}
            />

            {/* Multiplicidad origen */}
            {edge.sourceMult && (
              <g
                className="pointer-events-auto cursor-pointer"
                onClick={(ev) => {
                  ev.stopPropagation();
                  const custom = new CustomEvent("edit-edge", { detail: { id: edge.id, focus: "sourceMult" }, bubbles: true });
                  canvasRef.current?.dispatchEvent(custom);
                  onOpenMenu({ id: edge.id, x: sourceMultX, y: sourceMultY });
                }}
              >
                <rect
                  x={sourceMultX - 12}
                  y={sourceMultY - 8}
                  width="24"
                  height="16"
                  fill="var(--color-background)"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={sourceMultX}
                  y={sourceMultY}
                  className="text-xs fill-foreground font-medium"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {edge.sourceMult}
                </text>
              </g>
            )}

            {/* Multiplicidad destino */}
            {edge.targetMult && (
              <g
                className="pointer-events-auto cursor-pointer"
                onClick={(ev) => {
                  ev.stopPropagation();
                  const custom = new CustomEvent("edit-edge", { detail: { id: edge.id, focus: "targetMult" }, bubbles: true });
                  canvasRef.current?.dispatchEvent(custom);
                  onOpenMenu({ id: edge.id, x: targetMultX, y: targetMultY });
                }}
              >
                <rect
                  x={targetMultX - 12}
                  y={targetMultY - 8}
                  width="24"
                  height="16"
                  fill="var(--color-background)"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={targetMultX}
                  y={targetMultY}
                  className="text-xs fill-foreground font-medium"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {edge.targetMult}
                </text>
              </g>
            )}

            {/* Etiqueta de la relación */}
            <text
              x={midX}
              y={midY - 12}
              className="text-xs fill-muted-foreground font-medium pointer-events-none"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {label}
            </text>

            {/* Decoración de clase intermedia (UML): línea discontinua + chip */}
            {edge.associationClassId && (
              <>
                {assocCx != null && assocCy != null && (
                  <line
                    x1={midX}
                    y1={midY}
                    x2={assocCx}
                    y2={assocCy}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    className="text-foreground/60"
                  />
                )}
                {/* chip sobre el punto medio */}
                <foreignObject x={midX - 70} y={midY + 6} width={140} height={28}>
                  <div
                    className="px-2 py-0.5 rounded-full text-xs text-foreground/80 bg-muted/70 border border-border/50 mx-auto w-fit"
                    style={{ backdropFilter: "blur(2px)" }}
                  >
                    {assocName}
                  </div>
                </foreignObject>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
