import '@/styles/globals.scss'
import type { ReactNode } from 'react'
import KiaseApp from './_app'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <KiaseApp>{children}</KiaseApp>
      </body>
    </html>
  )
}
