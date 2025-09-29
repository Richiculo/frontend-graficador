export function getRelationStyle(kind: string) {
  switch (kind) {
    case "INHERITANCE":
      return { strokeDasharray: "none", markerEnd: "url(#inheritance-arrow)" };
    case "IMPLEMENTATION":
      return { strokeDasharray: "5,5", markerEnd: "url(#inheritance-arrow)" };
    case "COMPOSITION":
      return { strokeDasharray: "none", markerEnd: "url(#composition-diamond)" };
    case "AGGREGATION":
      return { strokeDasharray: "none", markerEnd: "url(#aggregation-diamond)" };
    default:
      return { strokeDasharray: "none", markerEnd: "url(#arrow)" };
  }
}
