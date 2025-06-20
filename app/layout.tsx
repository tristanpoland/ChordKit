import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChordKit - Guitar Chord Sheets Library',
  description: 'A beautiful collection of guitar chord sheets with interactive chord diagrams. Browse, search, and play your favorite songs.',
  keywords: ['guitar', 'chords', 'music', 'tabs', 'chord sheets', 'songbook'],
  authors: [{ name: 'ChordKit' }],
  creator: 'ChordKit',
  publisher: 'ChordKit',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'ChordKit - Guitar Chord Sheets Library',
    description: 'A beautiful collection of guitar chord sheets with interactive chord diagrams.',
    siteName: 'ChordKit',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChordKit - Guitar Chord Sheets Library',
    description: 'A beautiful collection of guitar chord sheets with interactive chord diagrams.',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2563eb',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

      </head>
      <body className={`${inter.className} bg-black antialiased`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}