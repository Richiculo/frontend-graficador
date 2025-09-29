export type Project = {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export type Diagram = {
  id: string
  projectId: string
  name: string
  // ... agrega lo que exponga tu backend
}

export type RelationType = 'ASSOCIATION' | 'AGGREGATION' | 'COMPOSITION' | 'INHERITANCE' | 'IMPLEMENTATION'

export type UmlAttribute = {
  id: number
  name: string
  type: string
  order: number
}

export type UmlMethod = {
  id: number
  name: string
  returnType: string
  order: number
}