// app/projects/new/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createProject } from "@/lib/projects"
import { getOrCreatePrimaryDiagram } from "@/lib/projects"

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setLoading(true)
      const p = await createProject({ name: name.trim(), description: description.trim() || undefined })
      // Abrir o crear diagrama principal
      const d = await getOrCreatePrimaryDiagram(p.id)
      router.replace(`/editor/${d.id}?projectId=${p.id}`)
    } catch (err) {
      console.error(err)
      alert("No se pudo crear el proyecto.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Nuevo proyecto</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input
              className="w-full rounded-lg border border-border bg-card px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi proyecto UML"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Descripción (opcional)</label>
            <textarea
              className="w-full rounded-lg border border-border bg-card px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descripción breve…"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium disabled:opacity-60"
            >
              {loading ? "Creando…" : "Crear proyecto"}
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
