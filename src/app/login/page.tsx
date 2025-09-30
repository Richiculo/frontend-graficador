"use client"
import { useState, useMemo } from "react"
import type React from "react"

import { api } from "@/lib/api"
import { useAuth } from "@/store/auth"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, UserPlus } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAuth = useAuth((s) => s.setAuth)
  const router = useRouter()

  const canSubmit = useMemo(() => {
    if (!email || !password) return false
    // validación rápida de email
    const ok = /.+@.+\..+/.test(email)
    return ok && password.length >= 6
  }, [email, password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post("/auth/login", { email, password })
      const token = data.access_token ?? data.token
      if (!token) throw new Error("No se recibió token")
      setAuth(token, data.user)
      router.replace("/projects")
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error de autenticación"
      setError(Array.isArray(msg) ? msg.join(", ") : msg)
    } finally {
      setLoading(false)
    }
  }

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
          <form
            onSubmit={onSubmit}
            className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl shadow-primary/5 space-y-6"
          >
            <header className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-primary rounded-md" />
              </div>
              <h1 className="text-3xl font-bold text-balance">
                Bienvenido a <span className="text-primary">Graficador</span>
              </h1>
              <p className="text-muted-foreground text-balance">Accede para continuar con tus proyectos</p>
            </header>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md hover:bg-accent"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p role="alert" className="text-destructive text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              aria-busy={loading}
              className="w-full group relative overflow-hidden bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>

            <div className="text-center pt-4 border-t border-border/50 space-y-3">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 inline-flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  Crear cuenta
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                ¿Problemas para acceder?{" "}
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                >
                  Contacta soporte
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
