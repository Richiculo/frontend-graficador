"use client";
import { useEffect } from "react";

type Params = {
  selectedId?: number;
  setRelationSource: (v: number | undefined) => void;
  setEdgeMenu: (v: { id: number; x: number; y: number } | null) => void;
  toggleRelationMode: () => void;
};

export function useShortcuts({ selectedId, setRelationSource, setEdgeMenu }: Params) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setRelationSource(undefined);
        setEdgeMenu(null);
      }
      if (e.key === " ") {
        // handled in DiagramCanvas to set spaceDown
      }
      if (e.key === "Delete" && selectedId) {
        const el = document.getElementById(`class-${selectedId}`);
        el?.dispatchEvent(new CustomEvent("delete-class", { bubbles: true }));
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        const btn = document.getElementById("btn-snap");
        (btn as HTMLButtonElement | null)?.click();
      }
      if (e.key.toLowerCase() === "r") {
        (document.getElementById("btn-relate") as HTMLButtonElement | null)?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, setRelationSource, setEdgeMenu]);
}
