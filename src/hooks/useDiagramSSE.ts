// hooks/useDiagramSSE.ts
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/store/auth"
import { useEditor } from "@/store/editor"

type PresenceUser = { id: number; email: string; name?: string }

export function useDiagramSSE(diagramId?: number) {
  const { token } = useAuth()
  const { moveNode, addNode, setNodes, addEdge, removeEdgeLocal } = useEditor()

  const [presence, setPresence] = useState<PresenceUser[]>([])
  const esRef = useRef<EventSource | null>(null)
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // para usar un snapshot de nodos cuando llegue class.deleted
  const nodesRef = useRef<any[]>([])
  nodesRef.current = useEditor().nodes

  useEffect(() => {
    if (!diagramId || !token) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/,"")
    const url = `${apiUrl}/diagrams/${diagramId}/events?access_token=${encodeURIComponent(token)}`
    // cerrar anterior si existiera
    esRef.current?.close()

    const es = new EventSource(url, { withCredentials: false })
    esRef.current = es

    es.onopen = () => {
      // opcional: console.log("SSE abierto", diagramId)
    }

    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data)
        switch (evt.type) {
          case "ping":
            break

          case "presence":
            setPresence(Array.isArray(evt.users) ? evt.users : [])
            break

          case "class.moved": {
            const { id, x, y } = evt.node
            if (typeof id === "number") moveNode(id, x, y)
            break
          }

          case "class.created": {
            const c = evt.node // { id, name, x, y }
            if (c?.id) addNode({ id: c.id, name: c.name, x: c.x, y: c.y })
            break
          }

          case "class.deleted": {
            const delId: number = evt.id
            const next = (nodesRef.current || []).filter((n) => n.id !== delId)
            setNodes(next)
            break
          }

          case "relation.created": {
            if (evt.edge?.id) addEdge(evt.edge)
            break
          }

          case "relation.deleted": {
            if (evt.id) removeEdgeLocal(evt.id)
            break
          }

          case "relation.updated": {
            // simple: quitar y volver a agregar
            if (evt.edge?.id) {
              removeEdgeLocal(evt.edge.id)
              addEdge(evt.edge)
            }
            break
          }
        }
      } catch {
        // silenciar parse error
      }
    }

    es.onerror = () => {
      // si falla, cerramos y probamos reconectar simple
      esRef.current?.close()
      setTimeout(() => {
        if (esRef.current?.readyState === EventSource.CLOSED) {
          // reintento: recreamos el efecto cambiando una key (opcional) o simplemente dejamos que el usuario recargue
        }
      }, 3000)
    }

    // heartbeat de presencia cada 20s
    const beat = async () => {
      try {
        // usamos el axios global con interceptor de auth,
        // pero aquí es más directo: fetch con Authorization funciona igual
        await fetch(`${apiUrl}/diagrams/${diagramId}/presence/heartbeat`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch { /* noop */ }
    }
    beat()
    hbRef.current = setInterval(beat, 20000)

    return () => {
      esRef.current?.close()
      esRef.current = null
      if (hbRef.current) clearInterval(hbRef.current)
    }
  }, [diagramId, token, moveNode, addNode, setNodes, addEdge, removeEdgeLocal])

  // para el chip compacto “Solo tú / X · +N”
  const compact = useMemo(() => {
    const list = (presence ?? []).map((u) => u.name || u.email)
    if (list.length <= 1) return list
    return [list[0], `+${list.length - 1}`]
  }, [presence?.length])

  return { presence, compact }
}
