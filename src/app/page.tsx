"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useAuthReady } from "@/store/auth"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { token } = useAuth()
  const isReady = useAuthReady()

  useEffect(() => {
    if (isReady) {
      if (token) {
        // Si está autenticado, redirigir a projects
        router.replace("/projects")
      } else {
        // Si no está autenticado, redirigir a login
        router.replace("/login")
      }
    }
  }, [token, isReady, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-subtle"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="w-full max-w-md relative">
        <div className="animate-fade-in-up">
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl shadow-primary/5 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-primary rounded-md" />
            </div>
            <h1 className="text-3xl font-bold text-balance mb-4">
              Bienvenido a <span className="text-primary">Graficador</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirigiendo...</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
