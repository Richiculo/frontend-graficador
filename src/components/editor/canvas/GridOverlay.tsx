"use client";
import { GRID_SIZE } from "./constants";

export default function GridOverlay({ zoom, pan }: { zoom: number; pan: { x: number; y: number } }) {
  return (
    <div className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    />
  );
}
