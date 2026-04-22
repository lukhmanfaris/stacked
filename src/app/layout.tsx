import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono, Doto } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/contexts/query-client'
import { UserProvider } from '@/contexts/user-context'
import { Toaster } from '@/components/ui/sonner'
import { APP_CONFIG } from '@/lib/constants'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
})

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
})

const doto = Doto({
  variable: '--font-doto',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${doto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <UserProvider>
              {children}
              <Toaster position="bottom-right" />
            </UserProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
