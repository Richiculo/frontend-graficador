import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'Graficador UML',
  description: 'Editor de clases + generador Spring Boot',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
