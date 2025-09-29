import { api } from './api'
import {RelationType, UmlAttribute, UmlMethod} from './types';


export async function getDiagramsByProject(projectId: number | string) {
  const { data } = await api.get('/diagrams', { params: { projectId } })
  return data as Array<{
    id: number
    name: string
    classes: Array<{ id: number; name: string; x: number; y: number }>
    relations: Array<{
      id: number
      kind: RelationType
      sourceClassId: number | null
      targetClassId: number | null
      sourceMult: string
      targetMult: string
      sourceRole?: string | null
      targetRole?: string | null
      navigableAToB?: boolean
      navigableBToA?: boolean
    }>
  }>
}

// ------- clases -------
export async function getClasses(diagramId: number | string) {
  const { data } = await api.get(`/diagrams/${diagramId}/classes`)
  return data as Array<{ id: number; name: string; x: number; y: number }>
}
export async function getClassesFull(diagramId: number | string) {
  const { data } = await api.get(`/diagrams/${diagramId}/classes/full`)
  return data as Array<{
    id: number
    name: string
    x: number
    y: number
    attributes: UmlAttribute[]
    methods: UmlMethod[]
  }>
}
export async function createClass(diagramId: number | string, name: string, x: number, y: number) {
  const { data } = await api.post(`/diagrams/${diagramId}/classes`, { name, x, y, stereotype: null, isAbstract: false })
  return data as { id: number; name: string; x: number; y: number }
}
export async function moveClass(id: number, x: number, y: number) {
  const { data } = await api.patch(`/classes/${id}/move`, { x, y })
  return data
}
export async function renameClass(id: number, name: string) {
  const { data } = await api.patch(`/classes/${id}/rename`, { name })
  return data
}
export async function updateClass(id: number, body: { name?: string; stereotype?: string; isAbstract?: boolean; x?: number; y?: number }) {
  const { data } = await api.patch(`/classes/${id}`, body)
  return data
}
export async function deleteClass(id: number) {
  const { data } = await api.delete(`/classes/${id}`)
  return data
}

// ------- atributos -------
export async function getClassAttributes(classId: number | string) {
  const { data } = await api.get(`/classes/${classId}/attributes`)
  return data as UmlAttribute[]
}
export async function addAttribute(
  umlClassId: number,
  name: string,
  type: string,
  opts?: {
    defaultValue?: string | null;
    visibility?: 'PUBLIC' | 'PRIVATE' | 'PROTECTED';
    isStatic?: boolean;
    isReadOnly?: boolean;
  }
) {
  const { data } = await api.post(`/classes/${umlClassId}/attributes`, {
    name,
    type,
    // order: lo asigna el backend
    defaultValue: opts?.defaultValue ?? null,
    isReadOnly: !!opts?.isReadOnly,
    isStatic: !!opts?.isStatic,
    visibility: opts?.visibility ?? 'PUBLIC',
  });
  return data as { id: number };
}
export async function updateAttribute(id: number, body: {
  name?: string; type?: string; order?: number; defaultValue?: string | null;
  isStatic?: boolean; isReadOnly?: boolean; visibility?: string;
}) {
  const { data } = await api.patch(`/attributes/${id}`, body)
  return data
}
export async function deleteAttribute(id: number) {
  const { data } = await api.delete(`/attributes/${id}`)
  return data
}
export async function reorderAttributes(classId: number, from: number, to: number) {
  const { data } = await api.patch(`/classes/${classId}/attributes/reorder`, { from, to })
  return data
}

// ------- métodos -------
export async function getClassMethods(classId: number | string) {
  const { data } = await api.get(`/classes/${classId}/methods`)
  return data as UmlMethod[]
}
export async function addMethod(
  umlClassId: number,
  name: string,
  returnType: string,
  opts?: {
    visibility?: 'PUBLIC' | 'PRIVATE' | 'PROTECTED';
    isStatic?: boolean;
    isAbstract?: boolean;
  }
) {
  const { data } = await api.post(`/classes/${umlClassId}/methods`, {
    name,
    returnType,
    // order: se asigna en el backend
    isStatic: !!opts?.isStatic,
    isAbstract: !!opts?.isAbstract,
    visibility: opts?.visibility ?? 'PUBLIC',
  });
  return data as { id: number };
}
export async function updateMethod(id: number, body: {
  name?: string; returnType?: string; order?: number; isStatic?: boolean; isAbstract?: boolean; visibility?: string;
}) {
  const { data } = await api.patch(`/methods/${id}`, body)
  return data
}
export async function deleteMethod(id: number) {
  const { data } = await api.delete(`/methods/${id}`)
  return data
}

// ------- relaciones -------
export async function getRelations(diagramId: number | string) {
  const { data } = await api.get(`/diagrams/${diagramId}/relations`)
  // Permitimos que la API devuelva opcionalmente sourceClass/targetClass
  return data as Array<{
    id: number
    kind: RelationType
    sourceClassId: number | null
    targetClassId: number | null
    sourceMult: string
    targetMult: string
    sourceRole?: string | null
    targetRole?: string | null
    navigableAToB?: boolean
    navigableBToA?: boolean
    // fallback opcional
    sourceClass?: { id: number } | null
    targetClass?: { id: number } | null
  }>
}
export async function createRelation(diagramId: number | string, body: {
  kind: RelationType
  sourceClassId: number
  targetClassId: number
  sourceMult: string
  targetMult: string
  sourceRole?: string
  targetRole?: string
  navigableAToB?: boolean
  navigableBToA?: boolean
}) {
  const { data } = await api.post(`/diagrams/${diagramId}/relations`, body)
  return data as { id: number }
}
export async function updateRelation(
  diagramId: number | string,
  id: number,
  body: Partial<{
    kind: RelationType
    sourceClassId: number | null
    targetClassId: number | null
    sourceMult: string
    targetMult: string
    sourceRole: string | null
    targetRole: string | null
    navigableAToB: boolean
    navigableBToA: boolean
    associationClassId: number | null
  }>
) {
  try {
    const { data } = await api.patch(`/diagrams/${diagramId}/relations/${id}`, body);
    return data;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      // fallback compat sin diagramId
      const { data } = await api.patch(`/relations/${id}`, body);
      return data;
    }
    throw e;
  }
}

export async function deleteRelation(diagramId: number | string, id: number) {
  try {
    const { data } = await api.delete(`/diagrams/${diagramId}/relations/${id}`);
    return data;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      const { data } = await api.delete(`/relations/${id}`);
      return data;
    }
    throw e;
  }
}

// ------- validación / export -------
export async function validateDiagram(diagramId: number | string) {
  const { data } = await api.post(`/diagrams/${diagramId}/validate`, {})
  return data as { ok: boolean; issues: any[] }
}
export async function exportPostman(diagramId: number | string) {
  const res = await api.post(`/diagrams/${diagramId}/export/postman`, {}, { responseType: 'blob' })
  return res.data as Blob
}
export async function exportCode(diagramId: number | string) {
  const res = await api.post(`/diagrams/${diagramId}/export/spring`, {}, { responseType: 'blob' })
  return res.data as Blob
}
