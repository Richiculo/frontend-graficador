// src/components/editor/canvas/utils/geometry.ts
export type NodeLike = { id: number; x: number; y: number; width?: number; height?: number };

export function getConnectionPoints(
  sourceNode: NodeLike,
  targetNode: NodeLike,
  defaults: { width: number; height: number } // ← fallback
) {
  const sW = sourceNode.width ?? defaults.width;
  const sH = sourceNode.height ?? defaults.height;
  const tW = targetNode.width ?? defaults.width;
  const tH = targetNode.height ?? defaults.height;

  const sourceRect = { x: sourceNode.x, y: sourceNode.y, width: sW, height: sH };
  const targetRect = { x: targetNode.x, y: targetNode.y, width: tW, height: tH };

  const sx = sourceRect.x + sourceRect.width / 2;
  const sy = sourceRect.y + sourceRect.height / 2;
  const tx = targetRect.x + targetRect.width / 2;
  const ty = targetRect.y + targetRect.height / 2;

  const angle = Math.atan2(ty - sy, tx - sx);

  let sourceX: number, sourceY: number, targetX: number, targetY: number;

  if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
    sourceX = sx + (Math.cos(angle) > 0 ? sourceRect.width / 2 : -sourceRect.width / 2);
    sourceY = sy;
  } else {
    sourceX = sx;
    sourceY = sy + (Math.sin(angle) > 0 ? sourceRect.height / 2 : -sourceRect.height / 2);
  }

  const reverseAngle = angle + Math.PI;
  if (Math.abs(Math.cos(reverseAngle)) > Math.abs(Math.sin(reverseAngle))) {
    targetX = tx + (Math.cos(reverseAngle) > 0 ? targetRect.width / 2 : -targetRect.width / 2);
    targetY = ty;
  } else {
    targetX = tx;
    targetY = ty + (Math.sin(reverseAngle) > 0 ? targetRect.height / 2 : -targetRect.height / 2);
  }

  return { sourceX, sourceY, targetX, targetY };
}

export function getMultiplicityPositions(sourceX: number, sourceY: number, targetX: number, targetY: number) {
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const offsetFromEnd = 25;
  const offsetFromLine = 15;

  const sourceMultX = sourceX + Math.cos(angle) * offsetFromEnd + Math.cos(angle + Math.PI / 2) * offsetFromLine;
  const sourceMultY = sourceY + Math.sin(angle) * offsetFromEnd + Math.sin(angle + Math.PI / 2) * offsetFromLine;

  const targetMultX = targetX - Math.cos(angle) * offsetFromEnd + Math.cos(angle + Math.PI / 2) * offsetFromLine;
  const targetMultY = targetY - Math.sin(angle) * offsetFromEnd + Math.sin(angle + Math.PI / 2) * offsetFromLine;

  return { sourceMultX, sourceMultY, targetMultX, targetMultY };
}
