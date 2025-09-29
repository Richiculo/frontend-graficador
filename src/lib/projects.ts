import { api } from "@/lib/api"

export type ProjectDTO = {
  id: number
  uuid: string
  name: string
  description?: string
  diagrams?: any[]
}

export async function listProjectsByUser() {
  // El backend obtiene el userId del JWT; NO envíes userId por query.
  const { data } = await api.get("/projects")
  return data as ProjectDTO[]
}

export async function createProject(payload: { name: string; description?: string }) {
  const { data } = await api.post("/projects", payload)
  return data as ProjectDTO
}

export async function updateProject(id: number, payload: { name?: string; description?: string }) {
  const { data } = await api.patch(`/projects/${id}`, payload)
  return data as ProjectDTO
}

export async function deleteProject(id: number) {
  await api.delete(`/projects/${id}`)
}

// ---------- Diagrams ----------
export async function getDiagramsByProject(projectId: number | string) {
  const { data } = await api.get("/diagrams", { params: { projectId } })
  return data as Array<{ id: number; uuid: string; name: string; description?: string }>
}

export async function createDefaultDiagram(projectId: number | string) {
  const payload = { projectId: Number(projectId), name: "Diagrama Principal", description: "v1" }
  const { data } = await api.post("/diagrams", payload)
  return data as { id: number; uuid: string; name: string; description?: string }
}

/** Abre un proyecto: devuelve el primer diagrama o lo crea si no existe */
export async function getOrCreatePrimaryDiagram(projectId: number | string) {
  const diagrams = await getDiagramsByProject(projectId)
  if (diagrams.length > 0) return diagrams[0]
  return await createDefaultDiagram(projectId)
}
