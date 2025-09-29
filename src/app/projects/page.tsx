"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import {
  getOrCreatePrimaryDiagram,
  listProjectsByUser,
  updateProject,
  deleteProject,
  type ProjectDTO,
} from "@/lib/projects"
import { useAuth } from "@/store/auth"
import { useAuthGuardEffect } from "@/hooks/useAuthGuard"
import { Plus, FolderOpen, FileText, Loader2, MoreVertical, Trash2, Settings, LogOut } from "lucide-react"

export default function ProjectsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { clear } = useAuth()
  const { ready, authed } = useAuthGuardEffect()

  const [openingId, setOpeningId] = useState<number | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjectsByUser(),
    enabled: ready && authed, // 👉 solo dispara cuando ya hidrató y hay token
  })

  async function handleOpen(projectId: number) {
    try {
      setOpeningId(projectId)
      const diagram = await getOrCreatePrimaryDiagram(projectId)
      router.push(`/editor/${diagram.id}?projectId=${projectId}`)
    } catch (e) {
      console.error(e)
      alert("No se pudo abrir/crear el diagrama para este proyecto.")
    } finally {
      setOpeningId(null)
    }
  }

  async function handleEditMeta(p: ProjectDTO) {
    const name = window.prompt("Nombre del proyecto:", p.name)?.trim()
    if (name == null) return
    const description = window.prompt("Descripción (opcional):", p.description ?? "")?.trim()
    const changed = (name && name !== p.name) || ((description ?? "") !== (p.description ?? ""))
    if (!changed) return
    await updateProject(p.id, { name: name || p.name, description: description || undefined })
    await qc.invalidateQueries({ queryKey: ["projects"] })
  }

  async function handleDelete(p: ProjectDTO) {
    if (!confirm(`¿Eliminar el proyecto "${p.name}"?`)) return
    await deleteProject(p.id)
    await qc.invalidateQueries({ queryKey: ["projects"] })
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold gradient-text">Graficador</h1>
              <p className="text-muted-foreground">Gestiona tus diagramas UML</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-primary/25"
              >
                <Plus className="size-4" />
                Nuevo proyecto
              </Link>
              <button
                onClick={() => {
                  clear()
                  router.replace("/login")
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-muted/60 transition"
                title="Cerrar sesión"
              >
                <LogOut className="size-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Splash mientras hidrata o valida sesión */}
        {!ready || !authed ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" />
            Verificando sesión…
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>Cargando proyectos...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="text-destructive text-lg font-medium">Error al cargar proyectos</div>
              <p className="text-muted-foreground">No se pudo cargar la lista de proyectos.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Tus proyectos ({data?.length || 0})</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(data ?? []).map((p, idx) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpen(p.id)}
                  onKeyDown={(e) => (e.key === "Enter" ? handleOpen(p.id) : null)}
                  className="group relative bg-card border border-border rounded-2xl p-6 card-hover animate-fade-in-up cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <FolderOpen className="size-6 text-primary" />
                    </div>

                    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                        className="p-2 rounded-lg hover:bg-muted/60"
                        aria-label="Acciones"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                      {menuOpenId === p.id && (
                        <div
                          className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover shadow-lg z-20"
                          onMouseLeave={() => setMenuOpenId(null)}
                        >
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/70 text-sm"
                            onClick={() => {
                              setMenuOpenId(null)
                              handleEditMeta(p)
                            }}
                          >
                            <Settings className="size-4" />
                            Editar metadatos
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/70 text-sm text-destructive"
                            onClick={() => {
                              setMenuOpenId(null)
                              handleDelete(p)
                            }}
                          >
                            <Trash2 className="size-4" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {p.diagrams?.length ? (
                        <div className="flex items-center gap-1">
                          <FileText className="size-3" />
                          <span>
                            {p.diagrams.length} diagrama{p.diagrams.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ) : null}
                      {openingId === p.id && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-3 animate-spin" />
                          Abriendo...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {data?.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <FolderOpen className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay proyectos</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Comienza creando tu primer proyecto para gestionar diagramas UML.
                  </p>
                  <Link
                    href="/projects/new"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="size-4" />
                    Crear proyecto
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
