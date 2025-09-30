"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/store/auth"
import { acceptInvite } from "../../../lib/colab/api" // tu api.ts (colab)
import { useAuthGuardEffect } from "@/hooks/useAuthGuard"

type View = "loading" | "ok" | "error" | "mismatch"

export default function AcceptInvitePage() {
  const search = useSearchParams()
  const token = useMemo(() => search.get("token") ?? "", [search])
  const router = useRouter()
  const { token: jwt, user, clear } = useAuth()
  const { ready } = useAuthGuardEffect()
  const [view, setView] = useState<View>("loading")
  const [msg, setMsg] = useState("")

  // construir returnTo
  const returnTo = `/invitations/accept?token=${token}`

  useEffect(() => {
    if (!ready) return
    if (!token) {
      setMsg("Token de invitación faltante.")
      setView("error")
      return
    }
    if (!jwt) {
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }
    ;(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL!
        const res = await acceptInvite({ apiUrl, jwt, token })
        setView("ok")
        router.replace(`/editor/${res.diagramId}`)
      } catch (e: any) {
        const message = e?.message || ""
        if (message.toLowerCase().includes("belong") || message.toLowerCase().includes("email")) {
          // “Invite does not belong to this email”
          setView("mismatch")
        } else {
          setMsg(message || "No se pudo aceptar la invitación.")
          setView("error")
        }
      }
    })()
  }, [ready, jwt, token, router])

  if (view === "loading") {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Procesando invitación…</span>
        </div>
      </main>
    )
  }

  if (view === "mismatch") {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="max-w-md w-full rounded-xl border p-6 bg-card">
          <h1 className="text-lg font-semibold mb-2">Esta invitación no corresponde a tu email</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Iniciaste sesión como <strong>{user?.email}</strong>, pero la invitación es para otra cuenta.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => router.replace("/projects")}
              className="px-4 py-2 rounded-lg border"
            >
              Ir a proyectos
            </button>
            <button
              onClick={() => {
                clear()
                router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
              }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              Cambiar de cuenta
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (view === "error") {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">No se pudo aceptar la invitación</p>
          <p className="text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen grid place-items-center">
      <p className="text-foreground">Invitación aceptada. Redirigiendo…</p>
    </main>
  )
}
