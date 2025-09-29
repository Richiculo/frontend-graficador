"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useEditor } from "@/store/editor"
import AppSidebar from "@/components/sidebar/AppSidebar"
import DiagramCanvas from "@/components/editor/DiagramCanvas"
import { getClassesFull, getRelations } from "@/lib/diagram"
import { useAuth } from "@/store/auth"
import { useAuthGuardEffect } from "@/hooks/useAuthGuard"
import { Loader2 } from "lucide-react"

export default function EditorPage() {
  const router = useRouter()
  const { diagramId } = useParams<{ diagramId: string }>()
  const { ready, authed } = useAuthGuardEffect()
  const { token } = useAuth()

  const { setNodes, setEdges, setAttrMap, setMethodMap } = useEditor()

  // Carga del diagrama solamente cuando:
  // - la store ya rehidrató (ready)
  // - hay sesión (authed)
  // - existe diagramId
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!ready || !authed || !diagramId) return

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
            .filter(Boolean) as any[]
        )
      } catch (error) {
        console.error("Error loading diagram:", error)
        // TODO: mostrar toast si quieres
      }
    })()

    return () => {
      mounted = false
    }
  }, [ready, authed, diagramId, setNodes, setEdges, setAttrMap, setMethodMap])

  // Splash mientras se verifica sesión / hidratación
  if (!ready || !authed || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        Verificando sesión…
      </main>
    )
  }

  return (
    <main className="flex min-h-screen bg-background">
      <AppSidebar />
      <section className="flex-1">
        <DiagramCanvas />
      </section>
    </main>
  )
}
