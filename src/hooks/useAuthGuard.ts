"use client"
import { useAuth, useAuthReady } from "@/store/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuthGuardEffect() {
  const ready = useAuthReady()
  const token = useAuth((s) => s.token)
  const router = useRouter()

  useEffect(() => {
    if (ready && !token) router.replace("/login")
  }, [ready, token, router])

  return { ready, authed: !!token }
}
