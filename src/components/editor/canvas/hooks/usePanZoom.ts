"use client";
import { useCallback, useMemo, useRef, useState } from "react";

export function usePanZoom() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const panningRef = useRef<{ ox: number; oy: number } | null>(null);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = -e.deltaY;
    setZoom((z) => Math.min(2, Math.max(0.25, +(z + (delta > 0 ? 0.1 : -0.1)).toFixed(2))));
  }, []);

  const onMouseDownCanvas = useCallback((e: React.MouseEvent) => {
    if (!spaceDown) return;
    panningRef.current = { ox: e.clientX - pan.x, oy: e.clientY - pan.y };
  }, [spaceDown, pan]);

  const onMouseMoveCanvas = useCallback((e: React.MouseEvent) => {
    if (spaceDown && panningRef.current) {
      const { ox, oy } = panningRef.current;
      setPan({ x: e.clientX - ox, y: e.clientY - oy });
    }
  }, [spaceDown]);

  const onMouseUpCanvas = useCallback(() => {
    panningRef.current = null;
  }, []);

  const transformStyle = useMemo(
    () => ({ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" as const }),
    [pan, zoom]
  );

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return {
    zoom, pan, spaceDown, setSpaceDown,
    setZoom, setPan, resetView,
    onWheel, onMouseDownCanvas, onMouseMoveCanvas, onMouseUpCanvas,
    transformStyle
  };
}
