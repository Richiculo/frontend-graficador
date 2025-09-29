'use client'
import { create } from 'zustand'
import type { UmlAttribute, UmlMethod } from '@/lib/types'

export type UmlNode = { id: number; name: string; x: number; y: number }
export type UmlEdge = {
  id: number
  kind: 'ASSOCIATION' | 'AGGREGATION' | 'COMPOSITION' | 'INHERITANCE' | 'IMPLEMENTATION'
  sourceClassId: number | null
  targetClassId: number | null
  sourceMult: string
  targetMult: string
}

type EditorState = {
  nodes: UmlNode[]
  edges: UmlEdge[]
  selectedId?: number
  setAttrMap: (m: Record<number, UmlAttribute[]>) => void
  setMethodMap: (m: Record<number, UmlMethod[]>) => void

  // mapas (por clase) para atributos y métodos creados en esta sesión
  attrMap: Record<number, UmlAttribute[]>
  methodMap: Record<number, UmlMethod[]>

  // contadores locales de order
  attrOrder: Record<number, number>
  methodOrder: Record<number, number>

  // modo relación
  relationMode: boolean
  relationSource?: number

  setNodes: (n: UmlNode[]) => void
  setEdges: (e: UmlEdge[]) => void
  addNode: (n: UmlNode) => void
  moveNode: (id: number, x: number, y: number) => void
  select: (id?: number) => void
  rename: (id: number, name: string) => void
  removeNodeLocal: (id: number) => void

  addEdge: (e: UmlEdge) => void
  removeEdgeLocal: (id: number) => void

  // attrs/methods locales
  addAttrLocal: (classId: number, a: UmlAttribute) => void
  updateAttrLocal: (classId: number, attrId: number, patch: Partial<UmlAttribute>) => void
  removeAttrLocal: (classId: number, attrId: number) => void

  addMethodLocal: (classId: number, m: UmlMethod) => void
  updateMethodLocal: (classId: number, methodId: number, patch: Partial<UmlMethod>) => void
  removeMethodLocal: (classId: number, methodId: number) => void

  toggleRelationMode: () => void
  setRelationSource: (id?: number) => void

  nextAttrOrder: (classId: number) => number
  nextMethodOrder: (classId: number) => number

  selectedRelationId?: number | null;
  setSelectedRelation: (id?: number | null) => void;
}

export const useEditor = create<EditorState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedId: undefined,

  attrMap: {},
  methodMap: {},

  attrOrder: {},
  methodOrder: {},

  relationMode: false,
  relationSource: undefined,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (n) => set((s) => ({
    nodes: [...s.nodes, n],
    attrOrder: { ...s.attrOrder, [n.id]: s.attrOrder[n.id] ?? 0 },
    methodOrder: { ...s.methodOrder, [n.id]: s.methodOrder[n.id] ?? 0 },
    attrMap: { ...s.attrMap, [n.id]: s.attrMap[n.id] ?? [] },
    methodMap: { ...s.methodMap, [n.id]: s.methodMap[n.id] ?? [] },
  })),
  moveNode: (id, x, y) => set((s) => ({ nodes: s.nodes.map(n => n.id === id ? { ...n, x, y } : n) })),
  select: (id) => set({ selectedId: id }),
  rename: (id, name) => set((s) => ({ nodes: s.nodes.map(n => n.id === id ? { ...n, name } : n) })),
  removeNodeLocal: (id) => set((s) => ({
    nodes: s.nodes.filter(n => n.id !== id),
    edges: s.edges.filter(e => e.sourceClassId !== id && e.targetClassId !== id),
    selectedId: s.selectedId === id ? undefined : s.selectedId,
    attrMap: Object.fromEntries(Object.entries(s.attrMap).filter(([k]) => Number(k) !== id)),
    methodMap: Object.fromEntries(Object.entries(s.methodMap).filter(([k]) => Number(k) !== id)),
  })),

  addEdge: (e) => set((s) => ({ edges: [...s.edges, e] })),
  removeEdgeLocal: (id) => set((s) => ({ edges: s.edges.filter(x => x.id !== id) })),

  addAttrLocal: (classId, a) => set((s) => ({ attrMap: { ...s.attrMap, [classId]: [...(s.attrMap[classId] ?? []), a] } })),
  updateAttrLocal: (classId, attrId, patch) => set((s) => ({
    attrMap: { ...s.attrMap, [classId]: (s.attrMap[classId] ?? []).map(a => a.id === attrId ? { ...a, ...patch } : a) }
  })),
  removeAttrLocal: (classId, attrId) => set((s) => ({
    attrMap: { ...s.attrMap, [classId]: (s.attrMap[classId] ?? []).filter(a => a.id !== attrId) }
  })),

  addMethodLocal: (classId, m) => set((s) => ({ methodMap: { ...s.methodMap, [classId]: [...(s.methodMap[classId] ?? []), m] } })),
  updateMethodLocal: (classId, methodId, patch) => set((s) => ({
    methodMap: { ...s.methodMap, [classId]: (s.methodMap[classId] ?? []).map(m => m.id === methodId ? { ...m, ...patch } : m) }
  })),
  removeMethodLocal: (classId, methodId) => set((s) => ({
    methodMap: { ...s.methodMap, [classId]: (s.methodMap[classId] ?? []).filter(m => m.id !== methodId) }
  })),

  toggleRelationMode: () => set((s) => ({ relationMode: !s.relationMode, relationSource: undefined })),
  setRelationSource: (id) => set({ relationSource: id }),

  nextAttrOrder: (classId) => {
    const curr = get().attrOrder[classId] ?? 0
    const next = curr + 1
    set((s) => ({ attrOrder: { ...s.attrOrder, [classId]: next } }))
    return next
  },
  nextMethodOrder: (classId) => {
    const curr = get().methodOrder[classId] ?? 0
    const next = curr + 1
    set((s) => ({ methodOrder: { ...s.methodOrder, [classId]: next } }))
    return next
  },
  setAttrMap: (m) => set({ attrMap: m }),
  setMethodMap: (m) => set({ methodMap: m }),

  selectedRelationId: null,
  setSelectedRelation: (id) => set({ selectedRelationId: id ?? null }),
}))
