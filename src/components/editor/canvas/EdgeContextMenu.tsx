"use client";

import { Edit3, Trash2 } from "lucide-react";
import React from "react";

type Props = {
  edgeMenu: { id: number; x: number; y: number } | null;
  zoom: number;
  pan: { x: number; y: number };
  onDelete: (id: number) => void;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
};

export default function EdgeContextMenu({ edgeMenu, zoom, pan, onDelete, onClose, canvasRef }: Props) {
  if (!edgeMenu) return null;
  return (
    <div
      className="absolute z-30 glass rounded-xl p-2"
      style={{
        left: `${edgeMenu.x * zoom + pan.x}px`,
        top: `${edgeMenu.y * zoom + pan.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-lg text-foreground hover:bg-white/10 transition-all duration-200"
          title="Editar relación"
          onClick={() => {
            const ev = new CustomEvent("edit-edge", { detail: { id: edgeMenu.id }, bubbles: true });
            canvasRef.current?.dispatchEvent(ev);
            onClose();
          }}
        >
          <Edit3 className="size-4" />
        </button>
        <button
          className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200"
          title="Eliminar relación"
          onClick={() => onDelete(edgeMenu.id)}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
