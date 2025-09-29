import axios from 'axios'
import { useAuth } from '@/store/auth'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false, // si usas cookies; si usas JWT por header, puedes poner false
})

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// auto-logout en 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      const { clear } = useAuth.getState()
      clear()
      // fuera de React Router, usamos location:
      if (typeof window !== "undefined") window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)