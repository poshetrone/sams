import type { Metadata } from 'next'
import './globals.css'
import './sams.css'
import ClickFX from '@/components/ClickFX'

export const metadata: Metadata = {
  title: 'S.A.M.S — San Andreas Medical Services',
  description: 'Portail médical interne du SAMS',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="root">{children}</div>
        <ClickFX />
      </body>
    </html>
  )
}
