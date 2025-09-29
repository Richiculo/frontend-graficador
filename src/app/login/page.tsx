"use client"

import { useAuth } from "@/store/auth"
import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { useEditor } from "@/store/editor"
import AppSidebar from "@/components/sidebar/AppSidebar"
import DiagramCanvas from "@/components/editor/DiagramCanvas"
import { getClassesFull, getRelations } from "@/lib/diagram"

export default function EditorPage() {
  const { token } = useAuth()
  const router = useRouter()
  const { diagramId } = useParams<{ diagramId: string }>()
  const { setNodes, setEdges, setAttrMap, setMethodMap } = useEditor()

  useEffect(() => {
    if (!token) router.replace("/login")
  }, [token, router])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!diagramId) return

      try {
        // 1) Clases con atributos y métodos
        const full = await getClassesFull(diagramId)
        if (!mounted) return
        setNodes(full.map((c) => ({ id: c.id, name: c.name, x: c.x, y: c.y })))

        const attrMap: Record<number, any[]> = {}
        const methodMap: Record<number, any[]> = {}
        full.forEach((c) => {
          attrMap[c.id] = c.attributes ?? []
          methodMap[c.id] = c.methods ?? []
        })
        setAttrMap(attrMap)
        setMethodMap(methodMap)

        // 2) Relaciones (ignora antiguas con extremos nulos)
        const rels = await getRelations(diagramId)
        if (!mounted) return

        setEdges(
          rels
            .map((r) => {
              const s = r.sourceClassId ?? r.sourceClass?.id ?? null
              const t = r.targetClassId ?? r.targetClass?.id ?? null
              return s && t
                ? {
                    id: r.id,
                    kind: r.kind,
                    sourceClassId: s,
                    targetClassId: t,
                    sourceMult: r.sourceMult,
                    targetMult: r.targetMult,
                  }
                : null
            })
            .filter(Boolean) as any[],
        )
      } catch (error) {
        console.error("Error loading diagram:", error)
        // Could add toast notification here
      }
    })()
    return () => {
      mounted = false
    }
  }, [diagramId, setNodes, setEdges, setAttrMap, setMethodMap])

  return (
    <main className="flex min-h-screen bg-background">
      <AppSidebar />
      <section className="flex-1">
        <DiagramCanvas />
      </section>
    </main>
  )
}
